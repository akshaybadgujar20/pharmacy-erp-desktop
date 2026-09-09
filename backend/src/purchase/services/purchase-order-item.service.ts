import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditAction } from '../../audit/audit-action.constants';
import { AuditModule } from '../../audit/audit-module.constants';
import { AuditService } from '../../audit/audit.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
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
import { OutboxEntityType } from '../../persistence/outbox/entity-type.constants';
import { OutboxOperation } from '../../persistence/outbox/outbox-operation.constants';
import { OutboxService } from '../../persistence/outbox/outbox.service';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import { CreatePurchaseOrderItemDto } from '../dto/create-purchase-order-item.dto';
import { UpdatePurchaseOrderItemDto } from '../dto/update-purchase-order-item.dto';
import { toPurchaseOrderItemResponse } from '../mappers/purchase-order-item.mapper';
import {
  assertDraftStatus,
  assertMedicineExists,
  computeLineAmounts,
  getNextLineNumber,
  optimisticUpdate,
  rollupPurchaseOrderTotals,
  throwConflict,
  throwNotFound,
} from '../utils/purchase.util';

@Injectable()
export class PurchaseOrderItemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly requestContext: RequestContextService,
  ) {}

  private async findParent(purchaseOrderId: bigint) {
    const scope = getTenantScope(this.requestContext);
    const order = await this.prisma.client.purchaseOrder.findFirst({
      where: withBranchScope(scope, { id: purchaseOrderId, deletedAt: null }),
    });

    if (!order) {
      throwNotFound(
        ErrorCode.PURCHASE_ORDER_NOT_FOUND,
        `Purchase order not found: ${purchaseOrderId}`,
        { purchaseOrderId: purchaseOrderId.toString() },
      );
    }

    return order;
  }

  private async findParentTx(
    tx: Prisma.TransactionClient,
    purchaseOrderId: bigint,
  ) {
    const scope = getTenantScope(this.requestContext);
    const order = await tx.purchaseOrder.findFirst({
      where: withBranchScope(scope, { id: purchaseOrderId, deletedAt: null }),
    });

    if (!order) {
      throwNotFound(
        ErrorCode.PURCHASE_ORDER_NOT_FOUND,
        `Purchase order not found: ${purchaseOrderId}`,
        { purchaseOrderId: purchaseOrderId.toString() },
      );
    }

    return order;
  }

  async list(purchaseOrderId: bigint, query: PaginationQueryDto) {
    await this.findParent(purchaseOrderId);

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.PurchaseOrderItemWhereInput = {
      purchaseOrderId,
      deletedAt: null,
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.purchaseOrderItem.count({ where }),
      this.prisma.client.purchaseOrderItem.findMany({
        where,
        orderBy: { lineNumber: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toPurchaseOrderItemResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(purchaseOrderId: bigint, id: bigint) {
    await this.findParent(purchaseOrderId);
    const item = await this.findActiveItem(purchaseOrderId, id);
    return toPurchaseOrderItemResponse(item);
  }

  async create(purchaseOrderId: bigint, dto: CreatePurchaseOrderItemDto) {
    return this.unitOfWork.run(async (tx) => {
      const parent = await this.findParentTx(tx, purchaseOrderId);
      assertDraftStatus(parent.status, 'Purchase order');
      await assertMedicineExists(tx, dto.medicineId);

      const duplicate = await tx.purchaseOrderItem.findFirst({
        where: {
          purchaseOrderId,
          medicineId: dto.medicineId,
          deletedAt: null,
        },
      });

      if (duplicate) {
        throwConflict(
          `Medicine already exists on purchase order: ${dto.medicineId}`,
          { medicineId: dto.medicineId.toString() },
        );
      }

      const lineAmounts = computeLineAmounts(
        dto.orderedQuantity,
        dto.unitPrice,
        dto.discountPercent,
        dto.discountAmount,
        dto.taxPercent,
        dto.taxAmount,
      );

      const now = BigInt(Date.now());
      const item = await tx.purchaseOrderItem.create({
        data: {
          uuid: randomUUID(),
          purchaseOrderId,
          medicineId: dto.medicineId,
          unitId: dto.unitId,
          lineNumber: await getNextLineNumber(
            tx,
            'purchaseOrderItem',
            'purchaseOrderId',
            purchaseOrderId,
          ),
          orderedQuantity: dto.orderedQuantity,
          conversionFactor: dto.conversionFactor ?? 1,
          unitPrice: dto.unitPrice,
          discountPercent: dto.discountPercent,
          discountAmount: lineAmounts.discountAmount,
          taxPercent: dto.taxPercent,
          taxAmount: lineAmounts.taxAmount,
          lineAmount: lineAmounts.lineAmount,
          createdAt: now,
          updatedAt: now,
        },
      });

      await rollupPurchaseOrderTotals(tx, purchaseOrderId);
      await this.emitParentChange(tx, parent);

      return toPurchaseOrderItemResponse(item);
    });
  }

  async update(
    purchaseOrderId: bigint,
    id: bigint,
    dto: UpdatePurchaseOrderItemDto,
  ) {
    return this.unitOfWork.run(async (tx) => {
      const parent = await this.findParentTx(tx, purchaseOrderId);
      assertDraftStatus(parent.status, 'Purchase order');

      const existing = await tx.purchaseOrderItem.findFirst({
        where: { id, purchaseOrderId, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.PURCHASE_ORDER_ITEM_NOT_FOUND,
          `Purchase order item not found: ${id}`,
          { id: id.toString() },
        );
      }

      const orderedQuantity = dto.orderedQuantity ?? existing.orderedQuantity;
      const unitPrice = dto.unitPrice ?? existing.unitPrice;
      const lineAmounts = computeLineAmounts(
        orderedQuantity,
        unitPrice,
        dto.discountPercent ?? existing.discountPercent,
        dto.discountAmount ?? existing.discountAmount,
        dto.taxPercent ?? existing.taxPercent,
        dto.taxAmount ?? existing.taxAmount,
      );

      const updateResult = await tx.purchaseOrderItem.updateMany({
        where: { id, purchaseOrderId, version: dto.version, deletedAt: null },
        data: {
          unitId: dto.unitId,
          orderedQuantity: dto.orderedQuantity,
          conversionFactor: dto.conversionFactor,
          unitPrice: dto.unitPrice,
          discountPercent: dto.discountPercent,
          discountAmount: lineAmounts.discountAmount,
          taxPercent: dto.taxPercent,
          taxAmount: lineAmounts.taxAmount,
          lineAmount: lineAmounts.lineAmount,
          isClosed: dto.isClosed,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Purchase order item version conflict or not found: ${id}`,
      );

      const item = await tx.purchaseOrderItem.findFirstOrThrow({
        where: { id },
      });
      await rollupPurchaseOrderTotals(tx, purchaseOrderId);
      await this.emitParentChange(tx, parent);

      return toPurchaseOrderItemResponse(item);
    });
  }

  async delete(purchaseOrderId: bigint, id: bigint, version: number) {
    return this.unitOfWork.run(async (tx) => {
      const parent = await this.findParentTx(tx, purchaseOrderId);
      assertDraftStatus(parent.status, 'Purchase order');

      const updateResult = await tx.purchaseOrderItem.updateMany({
        where: { id, purchaseOrderId, version, deletedAt: null },
        data: {
          deletedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Purchase order item version conflict or not found: ${id}`,
      );

      await rollupPurchaseOrderTotals(tx, purchaseOrderId);
      await this.emitParentChange(tx, parent);

      return { id: id.toString(), deleted: true };
    });
  }

  private async findActiveItem(purchaseOrderId: bigint, id: bigint) {
    const item = await this.prisma.client.purchaseOrderItem.findFirst({
      where: { id, purchaseOrderId, deletedAt: null },
    });

    if (!item) {
      throwNotFound(
        ErrorCode.PURCHASE_ORDER_ITEM_NOT_FOUND,
        `Purchase order item not found: ${id}`,
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
      entityType: OutboxEntityType.PURCHASE_ORDER,
      entityId: parent.id,
      entityUuid: parent.uuid,
      action: AuditAction.UPDATE,
      module: AuditModule.PURCHASE,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.PURCHASE_ORDER,
      entityUuid: parent.uuid,
      operation: OutboxOperation.UPDATE,
      payload: { uuid: parent.uuid },
    });
  }
}
