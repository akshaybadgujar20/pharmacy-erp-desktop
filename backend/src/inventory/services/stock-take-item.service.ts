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
import { StockTakeStatus } from '../constants/inventory.constants';
import { CreateStockTakeItemDto } from '../dto/create-stock-take-item.dto';
import { UpdateStockTakeItemDto } from '../dto/update-stock-take-item.dto';
import { toStockTakeItemResponse } from '../mappers/stock-take-item.mapper';
import {
  assertBatchExists,
  assertDraftStatus,
  computeVarianceType,
  optimisticUpdate,
  throwConflict,
  throwNotFound,
} from '../utils/inventory.util';

@Injectable()
export class StockTakeItemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly requestContext: RequestContextService,
  ) {}

  private async findParent(stockTakeId: bigint) {
    const scope = getTenantScope(this.requestContext);
    const stockTake = await this.prisma.client.stockTake.findFirst({
      where: withBranchScope(scope, { id: stockTakeId, deletedAt: null }),
    });

    if (!stockTake) {
      throwNotFound(
        ErrorCode.STOCK_TAKE_NOT_FOUND,
        `Stock take not found: ${stockTakeId}`,
        { stockTakeId: stockTakeId.toString() },
      );
    }

    return stockTake;
  }

  private async findParentTx(
    tx: Prisma.TransactionClient,
    stockTakeId: bigint,
  ) {
    const scope = getTenantScope(this.requestContext);
    const stockTake = await tx.stockTake.findFirst({
      where: withBranchScope(scope, { id: stockTakeId, deletedAt: null }),
    });

    if (!stockTake) {
      throwNotFound(
        ErrorCode.STOCK_TAKE_NOT_FOUND,
        `Stock take not found: ${stockTakeId}`,
        { stockTakeId: stockTakeId.toString() },
      );
    }

    return stockTake;
  }

  private computeVarianceFields(
    branchId: bigint,
    batchId: bigint,
    physicalQuantity: number,
    unitCost: Prisma.Decimal,
    systemQuantity: Prisma.Decimal,
  ) {
    const physical = new Prisma.Decimal(physicalQuantity);
    const varianceQuantity = physical.minus(systemQuantity);
    const varianceValue = varianceQuantity.mul(unitCost);
    const varianceType = computeVarianceType(varianceQuantity);

    return {
      systemQuantity,
      physicalQuantity: physical,
      varianceQuantity,
      varianceValue,
      varianceType,
      branchId,
      batchId,
    };
  }

  async list(stockTakeId: bigint, query: PaginationQueryDto) {
    await this.findParent(stockTakeId);

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.StockTakeItemWhereInput = {
      stockTakeId,
      deletedAt: null,
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.stockTakeItem.count({ where }),
      this.prisma.client.stockTakeItem.findMany({
        where,
        orderBy: { id: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toStockTakeItemResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(stockTakeId: bigint, id: bigint) {
    await this.findParent(stockTakeId);
    const item = await this.findActiveItem(stockTakeId, id);
    return toStockTakeItemResponse(item);
  }

  async create(stockTakeId: bigint, dto: CreateStockTakeItemDto) {
    return this.unitOfWork.run(async (tx) => {
      const parent = await this.findParentTx(tx, stockTakeId);
      if (
        parent.status !== StockTakeStatus.DRAFT &&
        parent.status !== StockTakeStatus.IN_PROGRESS
      ) {
        assertDraftStatus(parent.status, 'Stock take');
      }

      const batch = await assertBatchExists(tx, dto.batchId);

      const duplicate = await tx.stockTakeItem.findFirst({
        where: {
          stockTakeId,
          batchId: dto.batchId,
          deletedAt: null,
        },
      });

      if (duplicate) {
        throwConflict(`Batch already exists on stock take: ${dto.batchId}`, {
          batchId: dto.batchId.toString(),
        });
      }

      const stock = await tx.stock.findFirst({
        where: {
          branchId: parent.branchId,
          batchId: dto.batchId,
          deletedAt: null,
        },
      });

      const systemQuantity = new Prisma.Decimal(stock?.availableQuantity ?? 0);
      const varianceFields = this.computeVarianceFields(
        parent.branchId,
        dto.batchId,
        dto.physicalQuantity,
        batch.purchaseRate,
        systemQuantity,
      );

      const now = BigInt(Date.now());
      const item = await tx.stockTakeItem.create({
        data: {
          uuid: randomUUID(),
          stockTakeId,
          batchId: dto.batchId,
          systemQuantity: varianceFields.systemQuantity,
          physicalQuantity: varianceFields.physicalQuantity,
          varianceQuantity: varianceFields.varianceQuantity,
          unitCost: batch.purchaseRate,
          varianceValue: varianceFields.varianceValue,
          varianceType: varianceFields.varianceType,
          remarks: dto.remarks,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.STOCK_TAKE,
        entityId: parent.id,
        entityUuid: parent.uuid,
        action: AuditAction.UPDATE,
        module: AuditModule.INVENTORY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.STOCK_TAKE,
        entityUuid: parent.uuid,
        operation: OutboxOperation.UPDATE,
        payload: { uuid: parent.uuid, itemUuid: item.uuid },
      });

      return toStockTakeItemResponse(item);
    });
  }

  async update(stockTakeId: bigint, id: bigint, dto: UpdateStockTakeItemDto) {
    return this.unitOfWork.run(async (tx) => {
      const parent = await this.findParentTx(tx, stockTakeId);
      if (
        parent.status !== StockTakeStatus.DRAFT &&
        parent.status !== StockTakeStatus.IN_PROGRESS
      ) {
        assertDraftStatus(parent.status, 'Stock take');
      }

      const existingItem = await tx.stockTakeItem.findFirst({
        where: { id, stockTakeId, deletedAt: null },
        include: { batch: { select: { purchaseRate: true } } },
      });

      if (!existingItem) {
        throwNotFound(
          ErrorCode.STOCK_TAKE_ITEM_NOT_FOUND,
          `Stock take item not found: ${id}`,
          { id: id.toString() },
        );
      }

      const physicalQuantity =
        dto.physicalQuantity ?? existingItem.physicalQuantity.toNumber();
      const varianceFields = this.computeVarianceFields(
        parent.branchId,
        existingItem.batchId,
        physicalQuantity,
        existingItem.batch.purchaseRate,
        existingItem.systemQuantity,
      );

      const updateResult = await tx.stockTakeItem.updateMany({
        where: {
          id,
          stockTakeId,
          version: dto.version,
          deletedAt: null,
        },
        data: {
          physicalQuantity: varianceFields.physicalQuantity,
          varianceQuantity: varianceFields.varianceQuantity,
          varianceValue: varianceFields.varianceValue,
          varianceType: varianceFields.varianceType,
          remarks: dto.remarks,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Stock take item version conflict or not found: ${id}`,
      );

      const item = await tx.stockTakeItem.findFirstOrThrow({ where: { id } });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.STOCK_TAKE,
        entityId: parent.id,
        entityUuid: parent.uuid,
        action: AuditAction.UPDATE,
        module: AuditModule.INVENTORY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.STOCK_TAKE,
        entityUuid: parent.uuid,
        operation: OutboxOperation.UPDATE,
        payload: { uuid: parent.uuid, itemUuid: item.uuid },
      });

      return toStockTakeItemResponse(item);
    });
  }

  async delete(stockTakeId: bigint, id: bigint, version: bigint) {
    return this.unitOfWork.run(async (tx) => {
      const parent = await this.findParentTx(tx, stockTakeId);
      if (
        parent.status !== StockTakeStatus.DRAFT &&
        parent.status !== StockTakeStatus.IN_PROGRESS
      ) {
        assertDraftStatus(parent.status, 'Stock take');
      }

      const updateResult = await tx.stockTakeItem.updateMany({
        where: {
          id,
          stockTakeId,
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
        `Stock take item version conflict or not found: ${id}`,
      );

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.STOCK_TAKE,
        entityId: parent.id,
        entityUuid: parent.uuid,
        action: AuditAction.UPDATE,
        module: AuditModule.INVENTORY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.STOCK_TAKE,
        entityUuid: parent.uuid,
        operation: OutboxOperation.UPDATE,
        payload: { uuid: parent.uuid, deletedItemId: id.toString() },
      });

      return { id: id.toString(), deleted: true };
    });
  }

  private async findActiveItem(stockTakeId: bigint, id: bigint) {
    const item = await this.prisma.client.stockTakeItem.findFirst({
      where: { id, stockTakeId, deletedAt: null },
    });

    if (!item) {
      throwNotFound(
        ErrorCode.STOCK_TAKE_ITEM_NOT_FOUND,
        `Stock take item not found: ${id}`,
        { id: id.toString() },
      );
    }

    return item;
  }
}
