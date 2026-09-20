import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditAction } from '../../audit/audit-action.constants';
import { AuditModule } from '../../audit/audit-module.constants';
import { AuditService } from '../../audit/audit.service';
import { ErrorCode } from '../../common/exceptions/error-code';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  buildPagination,
  PaginatedResult,
} from '../../common/response/paginated-result';
import {
  getTenantScope,
  withBranchScope,
} from '../../persistence/context/tenant-scope.util';
import { RequestContextService } from '../../persistence/context/request-context.service';
import { OutboxEntityType } from '../../persistence/outbox/entity-type.constants';
import { OutboxOperation } from '../../persistence/outbox/outbox-operation.constants';
import { OutboxService } from '../../persistence/outbox/outbox.service';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import { PurchaseReturnStatus } from '../constants/purchase.constants';
import { CreatePurchaseReturnItemDto } from '../dto/create-purchase-return-item.dto';
import { UpdatePurchaseReturnItemDto } from '../dto/update-purchase-return-item.dto';
import { toPurchaseReturnItemResponse } from '../mappers/purchase-return-item.mapper';
import {
  assertBatchBelongsToMedicine,
  assertDraftStatus,
  assertMedicineExists,
  assertReturnQuantityAvailable,
  computeLineAmounts,
  getNextLineNumber,
  optimisticUpdate,
  rollupPurchaseReturnTotals,
  throwConflict,
  throwNotFound,
} from '../utils/purchase.util';

@Injectable()
export class PurchaseReturnItemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly requestContext: RequestContextService,
  ) {}

  private async findParent(purchaseReturnId: bigint) {
    const scope = getTenantScope(this.requestContext);
    const purchaseReturn = await this.prisma.client.purchaseReturn.findFirst({
      where: withBranchScope(scope, { id: purchaseReturnId, deletedAt: null }),
    });

    if (!purchaseReturn) {
      throwNotFound(
        ErrorCode.PURCHASE_RETURN_NOT_FOUND,
        `Purchase return not found: ${purchaseReturnId}`,
        { purchaseReturnId: purchaseReturnId.toString() },
      );
    }

    return purchaseReturn;
  }

  private async findParentTx(
    tx: Prisma.TransactionClient,
    purchaseReturnId: bigint,
  ) {
    const scope = getTenantScope(this.requestContext);
    const purchaseReturn = await tx.purchaseReturn.findFirst({
      where: withBranchScope(scope, { id: purchaseReturnId, deletedAt: null }),
    });

    if (!purchaseReturn) {
      throwNotFound(
        ErrorCode.PURCHASE_RETURN_NOT_FOUND,
        `Purchase return not found: ${purchaseReturnId}`,
        { purchaseReturnId: purchaseReturnId.toString() },
      );
    }

    return purchaseReturn;
  }

  async list(purchaseReturnId: bigint, query: PaginationQueryDto) {
    await this.findParent(purchaseReturnId);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.PurchaseReturnItemWhereInput = {
      purchaseReturnId,
      deletedAt: null,
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.purchaseReturnItem.count({ where }),
      this.prisma.client.purchaseReturnItem.findMany({
        where,
        orderBy: { lineNumber: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toPurchaseReturnItemResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(purchaseReturnId: bigint, id: bigint) {
    await this.findParent(purchaseReturnId);
    const item = await this.findActiveItem(purchaseReturnId, id);
    return toPurchaseReturnItemResponse(item);
  }

  async create(purchaseReturnId: bigint, dto: CreatePurchaseReturnItemDto) {
    return this.unitOfWork.run(async (tx) => {
      const parent = await this.findParentTx(tx, purchaseReturnId);
      assertDraftStatus(
        parent.status,
        'Purchase return',
        PurchaseReturnStatus.DRAFT,
      );
      await assertMedicineExists(tx, dto.medicineId);
      await assertBatchBelongsToMedicine(tx, dto.batchId, dto.medicineId);

      const duplicate = await tx.purchaseReturnItem.findFirst({
        where: {
          purchaseReturnId,
          batchId: dto.batchId,
          deletedAt: null,
        },
      });

      if (duplicate) {
        throwConflict(
          `Batch already exists on purchase return: ${dto.batchId}`,
          {
            batchId: dto.batchId.toString(),
          },
        );
      }

      const scope = getTenantScope(this.requestContext);
      await assertReturnQuantityAvailable(
        tx,
        scope.branchId,
        dto.batchId,
        dto.returnQuantity,
      );

      const lineAmounts = computeLineAmounts(
        dto.returnQuantity,
        dto.unitPrice,
        dto.discountPercent,
        dto.discountAmount,
        dto.taxPercent,
        dto.taxAmount,
      );

      const now = BigInt(Date.now());
      const item = await tx.purchaseReturnItem.create({
        data: {
          uuid: randomUUID(),
          purchaseReturnId,
          purchaseInvoiceItemId: dto.purchaseInvoiceItemId,
          medicineId: dto.medicineId,
          batchId: dto.batchId,
          unitId: dto.unitId,
          lineNumber: await getNextLineNumber(
            tx,
            'purchaseReturnItem',
            'purchaseReturnId',
            purchaseReturnId,
          ),
          returnQuantity: dto.returnQuantity,
          unitPrice: dto.unitPrice,
          discountPercent: dto.discountPercent,
          discountAmount: lineAmounts.discountAmount,
          taxPercent: dto.taxPercent,
          taxAmount: lineAmounts.taxAmount,
          lineAmount: lineAmounts.lineAmount,
          remarks: dto.remarks,
          createdAt: now,
          updatedAt: now,
        },
      });

      await rollupPurchaseReturnTotals(tx, purchaseReturnId);
      await this.emitParentChange(tx, parent);
      return toPurchaseReturnItemResponse(item);
    });
  }

  async update(
    purchaseReturnId: bigint,
    id: bigint,
    dto: UpdatePurchaseReturnItemDto,
  ) {
    return this.unitOfWork.run(async (tx) => {
      const parent = await this.findParentTx(tx, purchaseReturnId);
      assertDraftStatus(
        parent.status,
        'Purchase return',
        PurchaseReturnStatus.DRAFT,
      );

      const existing = await tx.purchaseReturnItem.findFirst({
        where: { id, purchaseReturnId, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.PURCHASE_RETURN_ITEM_NOT_FOUND,
          `Purchase return item not found: ${id}`,
          { id: id.toString() },
        );
      }

      const returnQuantity = dto.returnQuantity ?? existing.returnQuantity;
      const unitPrice = dto.unitPrice ?? existing.unitPrice;
      const batchId = dto.batchId ?? existing.batchId;
      if (dto.batchId) {
        await assertBatchBelongsToMedicine(tx, batchId, existing.medicineId);
      }

      if (dto.returnQuantity || dto.batchId) {
        const scope = getTenantScope(this.requestContext);
        await assertReturnQuantityAvailable(
          tx,
          scope.branchId,
          batchId,
          returnQuantity,
        );
      }

      const lineAmounts = computeLineAmounts(
        returnQuantity,
        unitPrice,
        dto.discountPercent ?? existing.discountPercent,
        dto.discountAmount ?? existing.discountAmount,
        dto.taxPercent ?? existing.taxPercent,
        dto.taxAmount ?? existing.taxAmount,
      );

      const updateResult = await tx.purchaseReturnItem.updateMany({
        where: { id, purchaseReturnId, version: dto.version, deletedAt: null },
        data: {
          batchId: dto.batchId,
          unitId: dto.unitId,
          purchaseInvoiceItemId: dto.purchaseInvoiceItemId,
          returnQuantity: dto.returnQuantity,
          unitPrice: dto.unitPrice,
          discountPercent: dto.discountPercent,
          discountAmount: lineAmounts.discountAmount,
          taxPercent: dto.taxPercent,
          taxAmount: lineAmounts.taxAmount,
          lineAmount: lineAmounts.lineAmount,
          remarks: dto.remarks,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Purchase return item version conflict or not found: ${id}`,
      );

      const item = await tx.purchaseReturnItem.findFirstOrThrow({
        where: { id },
      });
      await rollupPurchaseReturnTotals(tx, purchaseReturnId);
      await this.emitParentChange(tx, parent);

      return toPurchaseReturnItemResponse(item);
    });
  }

  async delete(purchaseReturnId: bigint, id: bigint, version: bigint) {
    return this.unitOfWork.run(async (tx) => {
      const parent = await this.findParentTx(tx, purchaseReturnId);
      assertDraftStatus(
        parent.status,
        'Purchase return',
        PurchaseReturnStatus.DRAFT,
      );

      const updateResult = await tx.purchaseReturnItem.updateMany({
        where: { id, purchaseReturnId, version, deletedAt: null },
        data: {
          deletedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Purchase return item version conflict or not found: ${id}`,
      );

      await rollupPurchaseReturnTotals(tx, purchaseReturnId);
      await this.emitParentChange(tx, parent);
      return { id: id.toString(), deleted: true };
    });
  }

  private async findActiveItem(purchaseReturnId: bigint, id: bigint) {
    const item = await this.prisma.client.purchaseReturnItem.findFirst({
      where: { id, purchaseReturnId, deletedAt: null },
    });

    if (!item) {
      throwNotFound(
        ErrorCode.PURCHASE_RETURN_ITEM_NOT_FOUND,
        `Purchase return item not found: ${id}`,
        { id: id.toString() },
      );
    }

    return item;
  }

  private async emitParentChange(
    tx: Prisma.TransactionClient,
    parent: { id: bigint; uuid: string },
  ) {
    await this.auditService.log(tx, {
      entityType: OutboxEntityType.PURCHASE_RETURN,
      entityId: parent.id,
      entityUuid: parent.uuid,
      action: AuditAction.UPDATE,
      module: AuditModule.PURCHASE,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.PURCHASE_RETURN,
      entityUuid: parent.uuid,
      operation: OutboxOperation.UPDATE,
      payload: { uuid: parent.uuid },
    });
  }
}
