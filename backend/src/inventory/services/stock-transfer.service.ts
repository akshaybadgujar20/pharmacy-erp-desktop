import { randomUUID } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditAction } from '../../audit/audit-action.constants';
import { AuditModule } from '../../audit/audit-module.constants';
import { AuditService } from '../../audit/audit.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import {
  buildPagination,
  PaginatedResult,
} from '../../common/response/paginated-result';
import { RequestContextService } from '../../persistence/context/request-context.service';
import { InventoryLedgerService } from '../../persistence/inventory/inventory-ledger.service';
import { OutboxEntityType } from '../../persistence/outbox/entity-type.constants';
import { OutboxOperation } from '../../persistence/outbox/outbox-operation.constants';
import { OutboxService } from '../../persistence/outbox/outbox.service';
import { DocumentType } from '../../persistence/sequence/document-type.constants';
import { SequenceGeneratorService } from '../../persistence/sequence/sequence-generator.service';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import {
  StockMovementType,
  StockTransferStatus,
} from '../constants/inventory.constants';
import { CreateStockTransferDto } from '../dto/create-stock-transfer.dto';
import { DispatchStockTransferDto } from '../dto/dispatch-stock-transfer.dto';
import { ReceiveStockTransferDto } from '../dto/receive-stock-transfer.dto';
import { UpdateStockTransferDto } from '../dto/update-stock-transfer.dto';
import { toStockTransferResponse } from '../mappers/stock-transfer.mapper';
import { assertBranchExists } from '../../configuration/utils/configuration.util';
import {
  assertDraftStatus,
  optimisticUpdate,
  throwConflict,
  throwNotFound,
} from '../utils/inventory.util';

@Injectable()
export class StockTransferService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly requestContext: RequestContextService,
    private readonly inventoryLedger: InventoryLedgerService,
    private readonly sequences: SequenceGeneratorService,
  ) {}

  async list(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();

    const where: Prisma.StockTransferWhereInput = {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { transferNumber: { contains: search } },
              { remarks: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.stockTransfer.count({ where }),
      this.prisma.client.stockTransfer.findMany({
        where,
        orderBy: { transferDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toStockTransferResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const transfer = await this.prisma.client.stockTransfer.findFirst({
      where: { id, deletedAt: null },
    });

    if (!transfer) {
      throwNotFound(
        ErrorCode.STOCK_TRANSFER_NOT_FOUND,
        `Stock transfer not found: ${id}`,
        { id: id.toString() },
      );
    }

    return toStockTransferResponse(transfer);
  }

  async create(dto: CreateStockTransferDto) {
    if (dto.sourceBranchId === dto.destinationBranchId) {
      throwConflict('Source and destination branches must differ', {
        sourceBranchId: dto.sourceBranchId.toString(),
        destinationBranchId: dto.destinationBranchId.toString(),
      });
    }

    return this.unitOfWork.run(async (tx) => {
      const sourceBranch = await assertBranchExists(tx, dto.sourceBranchId);
      await assertBranchExists(tx, dto.destinationBranchId);

      const { documentNumber } = await this.sequences.next(tx, {
        companyId: sourceBranch.companyId,
        branchId: sourceBranch.id,
        documentType: DocumentType.STOCK_TRANSFER,
        branchCode: sourceBranch.branchCode,
      });

      const now = BigInt(Date.now());
      const transfer = await tx.stockTransfer.create({
        data: {
          uuid: randomUUID(),
          transferNumber: documentNumber,
          sourceBranchId: dto.sourceBranchId,
          destinationBranchId: dto.destinationBranchId,
          transferDate: dto.transferDate,
          expectedArrivalDate: dto.expectedArrivalDate,
          transferType: dto.transferType,
          status: StockTransferStatus.DRAFT,
          remarks: dto.remarks,
          createdBy: this.requestContext.tryGet()?.userId,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.STOCK_TRANSFER,
        entityId: transfer.id,
        entityUuid: transfer.uuid,
        action: AuditAction.CREATE,
        module: AuditModule.INVENTORY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.STOCK_TRANSFER,
        entityUuid: transfer.uuid,
        operation: OutboxOperation.CREATE,
        payload: {
          uuid: transfer.uuid,
          transferNumber: transfer.transferNumber,
        },
      });

      return toStockTransferResponse(transfer);
    });
  }

  async update(id: bigint, dto: UpdateStockTransferDto) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.stockTransfer.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.STOCK_TRANSFER_NOT_FOUND,
          `Stock transfer not found: ${id}`,
          { id: id.toString() },
        );
      }

      assertDraftStatus(existing.status, 'Stock transfer');

      const updateResult = await tx.stockTransfer.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          transferDate: dto.transferDate,
          transferType: dto.transferType,
          expectedArrivalDate: dto.expectedArrivalDate,
          remarks: dto.remarks,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Stock transfer version conflict or not found: ${id}`,
      );

      const transfer = await tx.stockTransfer.findFirstOrThrow({
        where: { id },
      });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.STOCK_TRANSFER,
        entityId: transfer.id,
        entityUuid: transfer.uuid,
        action: AuditAction.UPDATE,
        module: AuditModule.INVENTORY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.STOCK_TRANSFER,
        entityUuid: transfer.uuid,
        operation: OutboxOperation.UPDATE,
        payload: {
          uuid: transfer.uuid,
          transferNumber: transfer.transferNumber,
        },
      });

      return toStockTransferResponse(transfer);
    });
  }

  async delete(id: bigint, version: number) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.stockTransfer.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.STOCK_TRANSFER_NOT_FOUND,
          `Stock transfer not found: ${id}`,
          { id: id.toString() },
        );
      }

      assertDraftStatus(existing.status, 'Stock transfer');

      const updateResult = await tx.stockTransfer.updateMany({
        where: { id, version, deletedAt: null },
        data: {
          deletedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Stock transfer version conflict or not found: ${id}`,
      );

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.STOCK_TRANSFER,
        entityId: existing.id,
        entityUuid: existing.uuid,
        action: AuditAction.DELETE,
        module: AuditModule.INVENTORY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.STOCK_TRANSFER,
        entityUuid: existing.uuid,
        operation: OutboxOperation.DELETE,
        payload: { uuid: existing.uuid },
      });

      return { id: id.toString(), deleted: true };
    });
  }

  async dispatch(id: bigint, dto: DispatchStockTransferDto) {
    return this.unitOfWork.run(async (tx) => {
      const transfer = await tx.stockTransfer.findFirst({
        where: { id, deletedAt: null },
        include: {
          items: {
            where: { deletedAt: null },
            include: { batch: { select: { medicineId: true } } },
          },
        },
      });

      if (!transfer) {
        throwNotFound(
          ErrorCode.STOCK_TRANSFER_NOT_FOUND,
          `Stock transfer not found: ${id}`,
          { id: id.toString() },
        );
      }

      if (
        transfer.status !== StockTransferStatus.DRAFT &&
        transfer.status !== StockTransferStatus.PENDING_APPROVAL
      ) {
        throw new ApplicationException(
          ErrorCode.INVALID_DOCUMENT_STATUS,
          'Only DRAFT or PENDING_APPROVAL transfers can be dispatched',
          HttpStatus.CONFLICT,
          { status: transfer.status },
        );
      }

      if (transfer.items.length === 0) {
        throw new ApplicationException(
          ErrorCode.DOCUMENT_HAS_NO_ITEMS,
          'Stock transfer must have at least one item',
          HttpStatus.BAD_REQUEST,
          { id: id.toString() },
        );
      }

      const sourceBranch = await assertBranchExists(
        tx,
        transfer.sourceBranchId,
      );
      const userId = this.requestContext.tryGet()?.userId;

      for (const item of transfer.items) {
        await this.inventoryLedger.applyMovement(tx, {
          branchId: transfer.sourceBranchId,
          branchCode: sourceBranch.branchCode,
          companyId: sourceBranch.companyId,
          medicineId: item.batch.medicineId,
          batchId: item.batchId,
          direction: 'OUT',
          quantity: item.sentQuantity,
          unitCost: 0,
          movementType: StockMovementType.TRANSFER_OUT,
          referenceTable: 'stock_transfers',
          referenceId: transfer.id,
          createdBy: userId,
          remarks: dto.remarks ?? item.remarks ?? undefined,
        });
      }

      const now = BigInt(Date.now());
      const updated = await tx.stockTransfer.update({
        where: { id },
        data: {
          status: StockTransferStatus.DISPATCHED,
          remarks: dto.remarks ?? transfer.remarks,
          updatedAt: now,
          version: { increment: 1 },
        },
      });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.STOCK_TRANSFER,
        entityId: updated.id,
        entityUuid: updated.uuid,
        action: AuditAction.UPDATE,
        module: AuditModule.INVENTORY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.STOCK_TRANSFER,
        entityUuid: updated.uuid,
        operation: OutboxOperation.UPDATE,
        payload: {
          uuid: updated.uuid,
          transferNumber: updated.transferNumber,
          status: updated.status,
        },
      });

      return toStockTransferResponse(updated);
    });
  }

  async receive(id: bigint, dto: ReceiveStockTransferDto) {
    return this.unitOfWork.run(async (tx) => {
      const transfer = await tx.stockTransfer.findFirst({
        where: { id, deletedAt: null },
        include: {
          items: {
            where: { deletedAt: null },
            include: {
              batch: { select: { medicineId: true, purchaseRate: true } },
            },
          },
        },
      });

      if (!transfer) {
        throwNotFound(
          ErrorCode.STOCK_TRANSFER_NOT_FOUND,
          `Stock transfer not found: ${id}`,
          { id: id.toString() },
        );
      }

      if (
        transfer.status !== StockTransferStatus.DISPATCHED &&
        transfer.status !== StockTransferStatus.IN_TRANSIT &&
        transfer.status !== StockTransferStatus.PARTIALLY_RECEIVED
      ) {
        throw new ApplicationException(
          ErrorCode.INVALID_DOCUMENT_STATUS,
          'Transfer must be dispatched before receiving',
          HttpStatus.CONFLICT,
          { status: transfer.status },
        );
      }

      const destBranch = await assertBranchExists(
        tx,
        transfer.destinationBranchId,
      );
      const userId = this.requestContext.tryGet()?.userId;
      let partial = false;

      for (const item of transfer.items) {
        const receivedQty = item.receivedQuantity ?? item.sentQuantity;
        if (receivedQty.lt(item.sentQuantity)) {
          partial = true;
        }

        if (receivedQty.lte(0)) {
          continue;
        }

        await this.inventoryLedger.applyMovement(tx, {
          branchId: transfer.destinationBranchId,
          branchCode: destBranch.branchCode,
          companyId: destBranch.companyId,
          medicineId: item.batch.medicineId,
          batchId: item.batchId,
          direction: 'IN',
          quantity: receivedQty,
          unitCost: item.batch.purchaseRate,
          movementType: StockMovementType.TRANSFER_IN,
          referenceTable: 'stock_transfers',
          referenceId: transfer.id,
          createdBy: userId,
          remarks: dto.remarks ?? item.remarks ?? undefined,
        });
      }

      const now = BigInt(Date.now());
      const updated = await tx.stockTransfer.update({
        where: { id },
        data: {
          status: partial
            ? StockTransferStatus.PARTIALLY_RECEIVED
            : StockTransferStatus.COMPLETED,
          receivedDate: now,
          remarks: dto.remarks ?? transfer.remarks,
          updatedAt: now,
          version: { increment: 1 },
        },
      });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.STOCK_TRANSFER,
        entityId: updated.id,
        entityUuid: updated.uuid,
        action: AuditAction.UPDATE,
        module: AuditModule.INVENTORY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.STOCK_TRANSFER,
        entityUuid: updated.uuid,
        operation: OutboxOperation.UPDATE,
        payload: {
          uuid: updated.uuid,
          transferNumber: updated.transferNumber,
          status: updated.status,
        },
      });

      return toStockTransferResponse(updated);
    });
  }
}
