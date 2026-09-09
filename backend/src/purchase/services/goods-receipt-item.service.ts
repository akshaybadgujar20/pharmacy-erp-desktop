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
import { GoodsReceiptStatus } from '../constants/purchase.constants';
import { CreateGoodsReceiptItemDto } from '../dto/create-goods-receipt-item.dto';
import { UpdateGoodsReceiptItemDto } from '../dto/update-goods-receipt-item.dto';
import { toGoodsReceiptItemResponse } from '../mappers/goods-receipt-item.mapper';
import {
  assertDraftStatus,
  assertMedicineExists,
  computeLineAmounts,
  getNextLineNumber,
  optimisticUpdate,
  throwNotFound,
} from '../utils/purchase.util';

@Injectable()
export class GoodsReceiptItemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly requestContext: RequestContextService,
  ) {}

  private async findParent(goodsReceiptId: bigint) {
    const scope = getTenantScope(this.requestContext);
    const receipt = await this.prisma.client.goodsReceipt.findFirst({
      where: withBranchScope(scope, { id: goodsReceiptId, deletedAt: null }),
    });

    if (!receipt) {
      throwNotFound(
        ErrorCode.GOODS_RECEIPT_NOT_FOUND,
        `Goods receipt not found: ${goodsReceiptId}`,
        { goodsReceiptId: goodsReceiptId.toString() },
      );
    }

    return receipt;
  }

  private async findParentTx(
    tx: Prisma.TransactionClient,
    goodsReceiptId: bigint,
  ) {
    const scope = getTenantScope(this.requestContext);
    const receipt = await tx.goodsReceipt.findFirst({
      where: withBranchScope(scope, { id: goodsReceiptId, deletedAt: null }),
    });

    if (!receipt) {
      throwNotFound(
        ErrorCode.GOODS_RECEIPT_NOT_FOUND,
        `Goods receipt not found: ${goodsReceiptId}`,
        { goodsReceiptId: goodsReceiptId.toString() },
      );
    }

    return receipt;
  }

  async list(goodsReceiptId: bigint, query: PaginationQueryDto) {
    await this.findParent(goodsReceiptId);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.GoodsReceiptItemWhereInput = {
      goodsReceiptId,
      deletedAt: null,
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.goodsReceiptItem.count({ where }),
      this.prisma.client.goodsReceiptItem.findMany({
        where,
        orderBy: { lineNumber: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toGoodsReceiptItemResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(goodsReceiptId: bigint, id: bigint) {
    await this.findParent(goodsReceiptId);
    const item = await this.findActiveItem(goodsReceiptId, id);
    return toGoodsReceiptItemResponse(item);
  }

  async create(goodsReceiptId: bigint, dto: CreateGoodsReceiptItemDto) {
    return this.unitOfWork.run(async (tx) => {
      const parent = await this.findParentTx(tx, goodsReceiptId);
      assertDraftStatus(
        parent.status,
        'Goods receipt',
        GoodsReceiptStatus.DRAFT,
      );
      await assertMedicineExists(tx, dto.medicineId);

      const lineAmounts = computeLineAmounts(
        dto.acceptedQuantity,
        dto.purchaseRate,
        dto.discountPercent,
        dto.discountAmount,
        dto.taxPercent,
        dto.taxAmount,
      );

      const now = BigInt(Date.now());
      const item = await tx.goodsReceiptItem.create({
        data: {
          uuid: randomUUID(),
          goodsReceiptId,
          purchaseOrderItemId: dto.purchaseOrderItemId,
          medicineId: dto.medicineId,
          unitId: dto.unitId,
          lineNumber: await getNextLineNumber(
            tx,
            'goodsReceiptItem',
            'goodsReceiptId',
            goodsReceiptId,
          ),
          batchNumber: dto.batchNumber,
          manufacturingDate: dto.manufacturingDate,
          expiryDate: dto.expiryDate,
          receivedQuantity: dto.receivedQuantity,
          freeQuantity: dto.freeQuantity ?? 0,
          rejectedQuantity: dto.rejectedQuantity ?? 0,
          acceptedQuantity: dto.acceptedQuantity,
          inspectionStatus: dto.inspectionStatus ?? 'PASSED',
          conversionFactor: dto.conversionFactor ?? 1,
          purchaseRate: dto.purchaseRate,
          mrp: dto.mrp,
          saleRate: dto.saleRate,
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

      await this.emitParentChange(tx, parent);
      return toGoodsReceiptItemResponse(item);
    });
  }

  async update(
    goodsReceiptId: bigint,
    id: bigint,
    dto: UpdateGoodsReceiptItemDto,
  ) {
    return this.unitOfWork.run(async (tx) => {
      const parent = await this.findParentTx(tx, goodsReceiptId);
      assertDraftStatus(
        parent.status,
        'Goods receipt',
        GoodsReceiptStatus.DRAFT,
      );

      const existing = await tx.goodsReceiptItem.findFirst({
        where: { id, goodsReceiptId, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.GOODS_RECEIPT_ITEM_NOT_FOUND,
          `Goods receipt item not found: ${id}`,
          { id: id.toString() },
        );
      }

      const acceptedQuantity =
        dto.acceptedQuantity ?? existing.acceptedQuantity;
      const purchaseRate = dto.purchaseRate ?? existing.purchaseRate;
      const lineAmounts = computeLineAmounts(
        acceptedQuantity,
        purchaseRate,
        dto.discountPercent ?? existing.discountPercent,
        dto.discountAmount ?? existing.discountAmount,
        dto.taxPercent ?? existing.taxPercent,
        dto.taxAmount ?? existing.taxAmount,
      );

      const updateResult = await tx.goodsReceiptItem.updateMany({
        where: { id, goodsReceiptId, version: dto.version, deletedAt: null },
        data: {
          unitId: dto.unitId,
          purchaseOrderItemId: dto.purchaseOrderItemId,
          batchNumber: dto.batchNumber,
          manufacturingDate: dto.manufacturingDate,
          expiryDate: dto.expiryDate,
          receivedQuantity: dto.receivedQuantity,
          freeQuantity: dto.freeQuantity,
          rejectedQuantity: dto.rejectedQuantity,
          acceptedQuantity: dto.acceptedQuantity,
          inspectionStatus: dto.inspectionStatus,
          purchaseRate: dto.purchaseRate,
          mrp: dto.mrp,
          saleRate: dto.saleRate,
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
        `Goods receipt item version conflict or not found: ${id}`,
      );

      const item = await tx.goodsReceiptItem.findFirstOrThrow({
        where: { id },
      });
      await this.emitParentChange(tx, parent);

      return toGoodsReceiptItemResponse(item);
    });
  }

  async delete(goodsReceiptId: bigint, id: bigint, version: number) {
    return this.unitOfWork.run(async (tx) => {
      const parent = await this.findParentTx(tx, goodsReceiptId);
      assertDraftStatus(
        parent.status,
        'Goods receipt',
        GoodsReceiptStatus.DRAFT,
      );

      const updateResult = await tx.goodsReceiptItem.updateMany({
        where: { id, goodsReceiptId, version, deletedAt: null },
        data: {
          deletedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Goods receipt item version conflict or not found: ${id}`,
      );

      await this.emitParentChange(tx, parent);
      return { id: id.toString(), deleted: true };
    });
  }

  private async findActiveItem(goodsReceiptId: bigint, id: bigint) {
    const item = await this.prisma.client.goodsReceiptItem.findFirst({
      where: { id, goodsReceiptId, deletedAt: null },
    });

    if (!item) {
      throwNotFound(
        ErrorCode.GOODS_RECEIPT_ITEM_NOT_FOUND,
        `Goods receipt item not found: ${id}`,
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
      entityType: OutboxEntityType.GOODS_RECEIPT,
      entityId: parent.id,
      entityUuid: parent.uuid,
      action: AuditAction.UPDATE,
      module: AuditModule.PURCHASE,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.GOODS_RECEIPT,
      entityUuid: parent.uuid,
      operation: OutboxOperation.UPDATE,
      payload: { uuid: parent.uuid },
    });
  }
}
