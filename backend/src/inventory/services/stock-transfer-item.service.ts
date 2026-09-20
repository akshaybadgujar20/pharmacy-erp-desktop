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
import { OutboxEntityType } from '../../persistence/outbox/entity-type.constants';
import { OutboxOperation } from '../../persistence/outbox/outbox-operation.constants';
import { OutboxService } from '../../persistence/outbox/outbox.service';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import { CreateStockTransferItemDto } from '../dto/create-stock-transfer-item.dto';
import { UpdateStockTransferItemDto } from '../dto/update-stock-transfer-item.dto';
import { toStockTransferItemResponse } from '../mappers/stock-transfer-item.mapper';
import {
  assertBatchExists,
  assertDraftStatus,
  optimisticUpdate,
  throwConflict,
  throwNotFound,
} from '../utils/inventory.util';

@Injectable()
export class StockTransferItemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
  ) {}

  private async findParent(transferId: bigint) {
    const transfer = await this.prisma.client.stockTransfer.findFirst({
      where: { id: transferId, deletedAt: null },
    });

    if (!transfer) {
      throwNotFound(
        ErrorCode.STOCK_TRANSFER_NOT_FOUND,
        `Stock transfer not found: ${transferId}`,
        { transferId: transferId.toString() },
      );
    }

    return transfer;
  }

  private async findParentTx(tx: Prisma.TransactionClient, transferId: bigint) {
    const transfer = await tx.stockTransfer.findFirst({
      where: { id: transferId, deletedAt: null },
    });

    if (!transfer) {
      throwNotFound(
        ErrorCode.STOCK_TRANSFER_NOT_FOUND,
        `Stock transfer not found: ${transferId}`,
        { transferId: transferId.toString() },
      );
    }

    return transfer;
  }

  async list(transferId: bigint, query: PaginationQueryDto) {
    await this.findParent(transferId);

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.StockTransferItemWhereInput = {
      stockTransferId: transferId,
      deletedAt: null,
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.stockTransferItem.count({ where }),
      this.prisma.client.stockTransferItem.findMany({
        where,
        orderBy: { id: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toStockTransferItemResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(transferId: bigint, id: bigint) {
    await this.findParent(transferId);
    const item = await this.findActiveItem(transferId, id);
    return toStockTransferItemResponse(item);
  }

  async create(transferId: bigint, dto: CreateStockTransferItemDto) {
    return this.unitOfWork.run(async (tx) => {
      const parent = await this.findParentTx(tx, transferId);
      assertDraftStatus(parent.status, 'Stock transfer');
      await assertBatchExists(tx, dto.batchId);

      const duplicate = await tx.stockTransferItem.findFirst({
        where: {
          stockTransferId: transferId,
          batchId: dto.batchId,
          deletedAt: null,
        },
      });

      if (duplicate) {
        throwConflict(`Batch already exists on transfer: ${dto.batchId}`, {
          batchId: dto.batchId.toString(),
        });
      }

      const now = BigInt(Date.now());
      const item = await tx.stockTransferItem.create({
        data: {
          uuid: randomUUID(),
          stockTransferId: transferId,
          batchId: dto.batchId,
          sentQuantity: dto.sentQuantity,
          remarks: dto.remarks,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.STOCK_TRANSFER,
        entityId: parent.id,
        entityUuid: parent.uuid,
        action: AuditAction.UPDATE,
        module: AuditModule.INVENTORY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.STOCK_TRANSFER,
        entityUuid: parent.uuid,
        operation: OutboxOperation.UPDATE,
        payload: { uuid: parent.uuid, itemUuid: item.uuid },
      });

      return toStockTransferItemResponse(item);
    });
  }

  async update(
    transferId: bigint,
    id: bigint,
    dto: UpdateStockTransferItemDto,
  ) {
    return this.unitOfWork.run(async (tx) => {
      const parent = await this.findParentTx(tx, transferId);
      assertDraftStatus(parent.status, 'Stock transfer');

      const updateResult = await tx.stockTransferItem.updateMany({
        where: {
          id,
          stockTransferId: transferId,
          version: dto.version,
          deletedAt: null,
        },
        data: {
          sentQuantity: dto.sentQuantity,
          receivedQuantity: dto.receivedQuantity,
          damagedQuantity: dto.damagedQuantity,
          remarks: dto.remarks,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Stock transfer item version conflict or not found: ${id}`,
      );

      const item = await tx.stockTransferItem.findFirstOrThrow({
        where: { id },
      });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.STOCK_TRANSFER,
        entityId: parent.id,
        entityUuid: parent.uuid,
        action: AuditAction.UPDATE,
        module: AuditModule.INVENTORY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.STOCK_TRANSFER,
        entityUuid: parent.uuid,
        operation: OutboxOperation.UPDATE,
        payload: { uuid: parent.uuid, itemUuid: item.uuid },
      });

      return toStockTransferItemResponse(item);
    });
  }

  async delete(transferId: bigint, id: bigint, version: bigint) {
    return this.unitOfWork.run(async (tx) => {
      const parent = await this.findParentTx(tx, transferId);
      assertDraftStatus(parent.status, 'Stock transfer');

      const updateResult = await tx.stockTransferItem.updateMany({
        where: {
          id,
          stockTransferId: transferId,
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
        `Stock transfer item version conflict or not found: ${id}`,
      );

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.STOCK_TRANSFER,
        entityId: parent.id,
        entityUuid: parent.uuid,
        action: AuditAction.UPDATE,
        module: AuditModule.INVENTORY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.STOCK_TRANSFER,
        entityUuid: parent.uuid,
        operation: OutboxOperation.UPDATE,
        payload: { uuid: parent.uuid, deletedItemId: id.toString() },
      });

      return { id: id.toString(), deleted: true };
    });
  }

  private async findActiveItem(transferId: bigint, id: bigint) {
    const item = await this.prisma.client.stockTransferItem.findFirst({
      where: { id, stockTransferId: transferId, deletedAt: null },
    });

    if (!item) {
      throwNotFound(
        ErrorCode.STOCK_TRANSFER_ITEM_NOT_FOUND,
        `Stock transfer item not found: ${id}`,
        { id: id.toString() },
      );
    }

    return item;
  }
}
