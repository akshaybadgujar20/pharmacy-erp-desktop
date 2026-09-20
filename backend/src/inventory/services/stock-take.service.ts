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
import {
  getTenantScope,
  withBranchScope,
} from '../../persistence/context/tenant-scope.util';
import { RequestContextService } from '../../persistence/context/request-context.service';
import { InventoryLedgerService } from '../../persistence/inventory/inventory-ledger.service';
import { OutboxEntityType } from '../../persistence/outbox/entity-type.constants';
import { OutboxOperation } from '../../persistence/outbox/outbox-operation.constants';
import { OutboxService } from '../../persistence/outbox/outbox.service';
import { DocumentType } from '../../persistence/sequence/document-type.constants';
import { SequenceGeneratorService } from '../../persistence/sequence/sequence-generator.service';
import { assertTransactionDateInOpenYear } from '../../persistence/ledger/ledger-posting.util';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import {
  StockAdjustmentStatus,
  StockAdjustmentType,
  StockMovementType,
  StockTakeStatus,
} from '../constants/inventory.constants';
import { CreateStockTakeDto } from '../dto/create-stock-take.dto';
import { ReconcileStockTakeDto } from '../dto/reconcile-stock-take.dto';
import { UpdateStockTakeDto } from '../dto/update-stock-take.dto';
import { toStockTakeResponse } from '../mappers/stock-take.mapper';
import { assertBranchExists } from '../../configuration/utils/configuration.util';
import {
  assertDraftStatus,
  assertEmployeeExists,
  optimisticUpdate,
  throwNotFound,
} from '../utils/inventory.util';

@Injectable()
export class StockTakeService {
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
    const scope = getTenantScope(this.requestContext);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();

    const where: Prisma.StockTakeWhereInput = withBranchScope(scope, {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { stockTakeNumber: { contains: search } },
              { remarks: { contains: search } },
            ],
          }
        : {}),
    });

    const [total, rows] = await Promise.all([
      this.prisma.client.stockTake.count({ where }),
      this.prisma.client.stockTake.findMany({
        where,
        orderBy: { stockTakeDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toStockTakeResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const scope = getTenantScope(this.requestContext);
    const stockTake = await this.prisma.client.stockTake.findFirst({
      where: withBranchScope(scope, { id, deletedAt: null }),
    });

    if (!stockTake) {
      throwNotFound(
        ErrorCode.STOCK_TAKE_NOT_FOUND,
        `Stock take not found: ${id}`,
        { id: id.toString() },
      );
    }

    return toStockTakeResponse(stockTake);
  }

  async create(dto: CreateStockTakeDto) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const branch = await assertBranchExists(tx, dto.branchId);
      await assertEmployeeExists(tx, dto.countedByEmployeeId);

      if (dto.branchId !== scope.branchId) {
        throw new ApplicationException(
          ErrorCode.FORBIDDEN,
          'Stock take branch must match request context branch',
          HttpStatus.FORBIDDEN,
          { branchId: dto.branchId.toString() },
        );
      }

      const { documentNumber } = await this.sequences.next(tx, {
        companyId: branch.companyId,
        branchId: branch.id,
        documentType: DocumentType.STOCK_TAKE,
        branchCode: branch.branchCode,
      });

      const now = BigInt(Date.now());
      const stockTake = await tx.stockTake.create({
        data: {
          uuid: randomUUID(),
          stockTakeNumber: documentNumber,
          branchId: dto.branchId,
          stockTakeDate: dto.stockTakeDate,
          countType: dto.countType,
          status: StockTakeStatus.DRAFT,
          countedByEmployeeId: dto.countedByEmployeeId,
          remarks: dto.remarks,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.STOCK_TAKE,
        entityId: stockTake.id,
        entityUuid: stockTake.uuid,
        action: AuditAction.CREATE,
        module: AuditModule.INVENTORY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.STOCK_TAKE,
        entityUuid: stockTake.uuid,
        operation: OutboxOperation.CREATE,
        payload: {
          uuid: stockTake.uuid,
          stockTakeNumber: stockTake.stockTakeNumber,
        },
      });

      return toStockTakeResponse(stockTake);
    });
  }

  async update(id: bigint, dto: UpdateStockTakeDto) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const existing = await tx.stockTake.findFirst({
        where: withBranchScope(scope, { id, deletedAt: null }),
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.STOCK_TAKE_NOT_FOUND,
          `Stock take not found: ${id}`,
          { id: id.toString() },
        );
      }

      assertDraftStatus(existing.status, 'Stock take');

      if (dto.countedByEmployeeId) {
        await assertEmployeeExists(tx, dto.countedByEmployeeId);
      }

      const updateResult = await tx.stockTake.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          stockTakeDate: dto.stockTakeDate,
          countType: dto.countType,
          countedByEmployeeId: dto.countedByEmployeeId,
          remarks: dto.remarks,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Stock take version conflict or not found: ${id}`,
      );

      const stockTake = await tx.stockTake.findFirstOrThrow({ where: { id } });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.STOCK_TAKE,
        entityId: stockTake.id,
        entityUuid: stockTake.uuid,
        action: AuditAction.UPDATE,
        module: AuditModule.INVENTORY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.STOCK_TAKE,
        entityUuid: stockTake.uuid,
        operation: OutboxOperation.UPDATE,
        payload: {
          uuid: stockTake.uuid,
          stockTakeNumber: stockTake.stockTakeNumber,
        },
      });

      return toStockTakeResponse(stockTake);
    });
  }

  async delete(id: bigint, version: bigint) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const existing = await tx.stockTake.findFirst({
        where: withBranchScope(scope, { id, deletedAt: null }),
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.STOCK_TAKE_NOT_FOUND,
          `Stock take not found: ${id}`,
          { id: id.toString() },
        );
      }

      assertDraftStatus(existing.status, 'Stock take');

      const updateResult = await tx.stockTake.updateMany({
        where: { id, version, deletedAt: null },
        data: {
          deletedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Stock take version conflict or not found: ${id}`,
      );

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.STOCK_TAKE,
        entityId: existing.id,
        entityUuid: existing.uuid,
        action: AuditAction.DELETE,
        module: AuditModule.INVENTORY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.STOCK_TAKE,
        entityUuid: existing.uuid,
        operation: OutboxOperation.DELETE,
        payload: { uuid: existing.uuid },
      });

      return { id: id.toString(), deleted: true };
    });
  }

  async start(id: bigint) {
    return this.updateStatus(id, StockTakeStatus.IN_PROGRESS, [
      StockTakeStatus.DRAFT,
    ]);
  }

  async complete(id: bigint) {
    return this.updateStatus(id, StockTakeStatus.COUNTED, [
      StockTakeStatus.IN_PROGRESS,
      StockTakeStatus.DRAFT,
    ]);
  }

  async reconcile(id: bigint, dto: ReconcileStockTakeDto) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const stockTake = await tx.stockTake.findFirst({
        where: withBranchScope(scope, { id, deletedAt: null }),
        include: {
          items: {
            where: { deletedAt: null, isReconciled: false },
            include: { batch: { select: { medicineId: true } } },
          },
        },
      });

      if (!stockTake) {
        throwNotFound(
          ErrorCode.STOCK_TAKE_NOT_FOUND,
          `Stock take not found: ${id}`,
          { id: id.toString() },
        );
      }

      if (
        stockTake.status !== StockTakeStatus.COUNTED &&
        stockTake.status !== StockTakeStatus.IN_PROGRESS
      ) {
        throw new ApplicationException(
          ErrorCode.INVALID_DOCUMENT_STATUS,
          'Stock take must be IN_PROGRESS or COUNTED to reconcile',
          HttpStatus.CONFLICT,
          { status: stockTake.status },
        );
      }

      const varianceItems = stockTake.items.filter(
        (item) => !new Prisma.Decimal(item.varianceQuantity).eq(0),
      );

      if (varianceItems.length > 0) {
        const branch = await assertBranchExists(tx, stockTake.branchId);
        await assertTransactionDateInOpenYear(
          tx,
          branch.companyId,
          stockTake.stockTakeDate,
        );
        const { documentNumber } = await this.sequences.next(tx, {
          companyId: branch.companyId,
          branchId: branch.id,
          documentType: DocumentType.STOCK_ADJUSTMENT,
          branchCode: branch.branchCode,
        });

        const now = BigInt(Date.now());
        const userId = this.requestContext.tryGet()?.userId;
        const adjustment = await tx.stockAdjustment.create({
          data: {
            uuid: randomUUID(),
            adjustmentNumber: documentNumber,
            branchId: stockTake.branchId,
            adjustmentType: StockAdjustmentType.GAIN,
            adjustmentDate: now,
            reason:
              dto.remarks ??
              `Stock take reconciliation ${stockTake.stockTakeNumber}`,
            status: StockAdjustmentStatus.APPROVED,
            approvedAt: now,
            createdBy: userId,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          },
        });

        for (const item of varianceItems) {
          const variance = new Prisma.Decimal(item.varianceQuantity);
          const adjItem = await tx.stockAdjustmentItem.create({
            data: {
              uuid: randomUUID(),
              stockAdjustmentId: adjustment.id,
              batchId: item.batchId,
              quantity: variance,
              unitCost: item.unitCost,
              remarks: item.remarks,
              createdAt: now,
              updatedAt: now,
            },
          });

          const isGain = variance.gt(0);
          await this.inventoryLedger.applyMovement(tx, {
            branchId: stockTake.branchId,
            branchCode: branch.branchCode,
            companyId: branch.companyId,
            medicineId: item.batch.medicineId,
            batchId: item.batchId,
            direction: isGain ? 'IN' : 'OUT',
            quantity: isGain ? variance : variance.abs(),
            unitCost: item.unitCost,
            movementType: isGain
              ? StockMovementType.ADJUSTMENT_GAIN
              : StockMovementType.ADJUSTMENT_LOSS,
            referenceTable: 'stock_adjustments',
            referenceId: adjustment.id,
            createdBy: userId,
            remarks: dto.remarks,
          });

          await tx.stockTakeItem.update({
            where: { id: item.id },
            data: {
              isReconciled: true,
              stockAdjustmentId: adjustment.id,
              updatedAt: now,
              version: { increment: 1 },
            },
          });

          await this.auditService.log(tx, {
            entityType: OutboxEntityType.STOCK_ADJUSTMENT,
            entityId: adjItem.id,
            entityUuid: adjItem.uuid,
            action: AuditAction.CREATE,
            module: AuditModule.INVENTORY,
          });
        }

        await this.outboxService.enqueue(tx, {
          entityType: OutboxEntityType.STOCK_ADJUSTMENT,
          entityUuid: adjustment.uuid,
          operation: OutboxOperation.CREATE,
          payload: {
            uuid: adjustment.uuid,
            adjustmentNumber: adjustment.adjustmentNumber,
            stockTakeId: stockTake.id.toString(),
          },
        });
      }

      const updated = await tx.stockTake.update({
        where: { id },
        data: {
          status: StockTakeStatus.RECONCILED,
          remarks: dto.remarks ?? stockTake.remarks,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.STOCK_TAKE,
        entityId: updated.id,
        entityUuid: updated.uuid,
        action: AuditAction.APPROVE,
        module: AuditModule.INVENTORY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.STOCK_TAKE,
        entityUuid: updated.uuid,
        operation: OutboxOperation.UPDATE,
        payload: {
          uuid: updated.uuid,
          stockTakeNumber: updated.stockTakeNumber,
          status: updated.status,
        },
      });

      return toStockTakeResponse(updated);
    });
  }

  private async updateStatus(
    id: bigint,
    targetStatus: string,
    allowedStatuses: string[],
  ) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const existing = await tx.stockTake.findFirst({
        where: withBranchScope(scope, { id, deletedAt: null }),
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.STOCK_TAKE_NOT_FOUND,
          `Stock take not found: ${id}`,
          { id: id.toString() },
        );
      }

      if (!allowedStatuses.includes(existing.status)) {
        throw new ApplicationException(
          ErrorCode.INVALID_DOCUMENT_STATUS,
          `Cannot transition from ${existing.status} to ${targetStatus}`,
          HttpStatus.CONFLICT,
          { status: existing.status, targetStatus },
        );
      }

      const updated = await tx.stockTake.update({
        where: { id },
        data: {
          status: targetStatus,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.STOCK_TAKE,
        entityId: updated.id,
        entityUuid: updated.uuid,
        action: AuditAction.UPDATE,
        module: AuditModule.INVENTORY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.STOCK_TAKE,
        entityUuid: updated.uuid,
        operation: OutboxOperation.UPDATE,
        payload: {
          uuid: updated.uuid,
          stockTakeNumber: updated.stockTakeNumber,
          status: updated.status,
        },
      });

      return toStockTakeResponse(updated);
    });
  }
}
