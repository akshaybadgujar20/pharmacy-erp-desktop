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
import { CreateStockAdjustmentItemDto } from '../dto/create-stock-adjustment-item.dto';
import { UpdateStockAdjustmentItemDto } from '../dto/update-stock-adjustment-item.dto';
import { toStockAdjustmentItemResponse } from '../mappers/stock-adjustment-item.mapper';
import {
  assertBatchExists,
  assertDraftStatus,
  optimisticUpdate,
  throwConflict,
  throwNotFound,
} from '../utils/inventory.util';

@Injectable()
export class StockAdjustmentItemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly requestContext: RequestContextService,
  ) {}

  private async findParent(adjustmentId: bigint) {
    const scope = getTenantScope(this.requestContext);
    const adjustment = await this.prisma.client.stockAdjustment.findFirst({
      where: withBranchScope(scope, { id: adjustmentId, deletedAt: null }),
    });

    if (!adjustment) {
      throwNotFound(
        ErrorCode.STOCK_ADJUSTMENT_NOT_FOUND,
        `Stock adjustment not found: ${adjustmentId}`,
        { adjustmentId: adjustmentId.toString() },
      );
    }

    return adjustment;
  }

  private async findParentTx(
    tx: Prisma.TransactionClient,
    adjustmentId: bigint,
  ) {
    const scope = getTenantScope(this.requestContext);
    const adjustment = await tx.stockAdjustment.findFirst({
      where: withBranchScope(scope, { id: adjustmentId, deletedAt: null }),
    });

    if (!adjustment) {
      throwNotFound(
        ErrorCode.STOCK_ADJUSTMENT_NOT_FOUND,
        `Stock adjustment not found: ${adjustmentId}`,
        { adjustmentId: adjustmentId.toString() },
      );
    }

    return adjustment;
  }

  async list(adjustmentId: bigint, query: PaginationQueryDto) {
    await this.findParent(adjustmentId);

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.StockAdjustmentItemWhereInput = {
      stockAdjustmentId: adjustmentId,
      deletedAt: null,
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.stockAdjustmentItem.count({ where }),
      this.prisma.client.stockAdjustmentItem.findMany({
        where,
        orderBy: { id: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toStockAdjustmentItemResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(adjustmentId: bigint, id: bigint) {
    await this.findParent(adjustmentId);
    const item = await this.findActiveItem(adjustmentId, id);
    return toStockAdjustmentItemResponse(item);
  }

  async create(adjustmentId: bigint, dto: CreateStockAdjustmentItemDto) {
    return this.unitOfWork.run(async (tx) => {
      const parent = await this.findParentTx(tx, adjustmentId);
      assertDraftStatus(parent.status, 'Stock adjustment');
      await assertBatchExists(tx, dto.batchId);

      const duplicate = await tx.stockAdjustmentItem.findFirst({
        where: {
          stockAdjustmentId: adjustmentId,
          batchId: dto.batchId,
          deletedAt: null,
        },
      });

      if (duplicate) {
        throwConflict(`Batch already exists on adjustment: ${dto.batchId}`, {
          batchId: dto.batchId.toString(),
        });
      }

      const now = BigInt(Date.now());
      const item = await tx.stockAdjustmentItem.create({
        data: {
          uuid: randomUUID(),
          stockAdjustmentId: adjustmentId,
          batchId: dto.batchId,
          quantity: dto.quantity,
          unitCost: dto.unitCost,
          remarks: dto.remarks,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.STOCK_ADJUSTMENT,
        entityId: parent.id,
        entityUuid: parent.uuid,
        action: AuditAction.UPDATE,
        module: AuditModule.INVENTORY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.STOCK_ADJUSTMENT,
        entityUuid: parent.uuid,
        operation: OutboxOperation.UPDATE,
        payload: { uuid: parent.uuid, itemUuid: item.uuid },
      });

      return toStockAdjustmentItemResponse(item);
    });
  }

  async update(
    adjustmentId: bigint,
    id: bigint,
    dto: UpdateStockAdjustmentItemDto,
  ) {
    return this.unitOfWork.run(async (tx) => {
      const parent = await this.findParentTx(tx, adjustmentId);
      assertDraftStatus(parent.status, 'Stock adjustment');

      const updateResult = await tx.stockAdjustmentItem.updateMany({
        where: {
          id,
          stockAdjustmentId: adjustmentId,
          version: dto.version,
          deletedAt: null,
        },
        data: {
          quantity: dto.quantity,
          unitCost: dto.unitCost,
          remarks: dto.remarks,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Stock adjustment item version conflict or not found: ${id}`,
      );

      const item = await tx.stockAdjustmentItem.findFirstOrThrow({
        where: { id },
      });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.STOCK_ADJUSTMENT,
        entityId: parent.id,
        entityUuid: parent.uuid,
        action: AuditAction.UPDATE,
        module: AuditModule.INVENTORY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.STOCK_ADJUSTMENT,
        entityUuid: parent.uuid,
        operation: OutboxOperation.UPDATE,
        payload: { uuid: parent.uuid, itemUuid: item.uuid },
      });

      return toStockAdjustmentItemResponse(item);
    });
  }

  async delete(adjustmentId: bigint, id: bigint, version: number) {
    return this.unitOfWork.run(async (tx) => {
      const parent = await this.findParentTx(tx, adjustmentId);
      assertDraftStatus(parent.status, 'Stock adjustment');

      const updateResult = await tx.stockAdjustmentItem.updateMany({
        where: {
          id,
          stockAdjustmentId: adjustmentId,
          version,
          deletedAt: null,
        },
        data: {
          deletedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Stock adjustment item version conflict or not found: ${id}`,
      );

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.STOCK_ADJUSTMENT,
        entityId: parent.id,
        entityUuid: parent.uuid,
        action: AuditAction.UPDATE,
        module: AuditModule.INVENTORY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.STOCK_ADJUSTMENT,
        entityUuid: parent.uuid,
        operation: OutboxOperation.UPDATE,
        payload: { uuid: parent.uuid, deletedItemId: id.toString() },
      });

      return { id: id.toString(), deleted: true };
    });
  }

  private async findActiveItem(adjustmentId: bigint, id: bigint) {
    const item = await this.prisma.client.stockAdjustmentItem.findFirst({
      where: { id, stockAdjustmentId: adjustmentId, deletedAt: null },
    });

    if (!item) {
      throwNotFound(
        ErrorCode.STOCK_ADJUSTMENT_ITEM_NOT_FOUND,
        `Stock adjustment item not found: ${id}`,
        { id: id.toString() },
      );
    }

    return item;
  }
}
