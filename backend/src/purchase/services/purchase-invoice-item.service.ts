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
import { PurchaseInvoiceStatus } from '../constants/purchase.constants';
import { CreatePurchaseInvoiceItemDto } from '../dto/create-purchase-invoice-item.dto';
import { UpdatePurchaseInvoiceItemDto } from '../dto/update-purchase-invoice-item.dto';
import { toPurchaseInvoiceItemResponse } from '../mappers/purchase-invoice-item.mapper';
import {
  assertDraftStatus,
  assertMedicineExists,
  computeLineAmounts,
  getNextLineNumber,
  optimisticUpdate,
  rollupPurchaseInvoiceTotals,
  throwNotFound,
} from '../utils/purchase.util';

@Injectable()
export class PurchaseInvoiceItemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly requestContext: RequestContextService,
  ) {}

  private async findParent(purchaseInvoiceId: bigint) {
    const scope = getTenantScope(this.requestContext);
    const invoice = await this.prisma.client.purchaseInvoice.findFirst({
      where: withBranchScope(scope, { id: purchaseInvoiceId, deletedAt: null }),
    });

    if (!invoice) {
      throwNotFound(
        ErrorCode.PURCHASE_INVOICE_NOT_FOUND,
        `Purchase invoice not found: ${purchaseInvoiceId}`,
        { purchaseInvoiceId: purchaseInvoiceId.toString() },
      );
    }

    return invoice;
  }

  private async findParentTx(
    tx: Prisma.TransactionClient,
    purchaseInvoiceId: bigint,
  ) {
    const scope = getTenantScope(this.requestContext);
    const invoice = await tx.purchaseInvoice.findFirst({
      where: withBranchScope(scope, { id: purchaseInvoiceId, deletedAt: null }),
    });

    if (!invoice) {
      throwNotFound(
        ErrorCode.PURCHASE_INVOICE_NOT_FOUND,
        `Purchase invoice not found: ${purchaseInvoiceId}`,
        { purchaseInvoiceId: purchaseInvoiceId.toString() },
      );
    }

    return invoice;
  }

  async list(purchaseInvoiceId: bigint, query: PaginationQueryDto) {
    await this.findParent(purchaseInvoiceId);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.PurchaseInvoiceItemWhereInput = {
      purchaseInvoiceId,
      deletedAt: null,
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.purchaseInvoiceItem.count({ where }),
      this.prisma.client.purchaseInvoiceItem.findMany({
        where,
        orderBy: { lineNumber: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toPurchaseInvoiceItemResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(purchaseInvoiceId: bigint, id: bigint) {
    await this.findParent(purchaseInvoiceId);
    const item = await this.findActiveItem(purchaseInvoiceId, id);
    return toPurchaseInvoiceItemResponse(item);
  }

  async create(purchaseInvoiceId: bigint, dto: CreatePurchaseInvoiceItemDto) {
    return this.unitOfWork.run(async (tx) => {
      const parent = await this.findParentTx(tx, purchaseInvoiceId);
      assertDraftStatus(
        parent.status,
        'Purchase invoice',
        PurchaseInvoiceStatus.DRAFT,
      );
      await assertMedicineExists(tx, dto.medicineId);

      const batch = await tx.batch.findFirst({
        where: { id: dto.batchId, deletedAt: null },
      });

      if (!batch) {
        throwNotFound(
          ErrorCode.BATCH_NOT_FOUND,
          `Batch not found: ${dto.batchId}`,
          {
            batchId: dto.batchId.toString(),
          },
        );
      }

      const lineAmounts = computeLineAmounts(
        dto.invoiceQuantity,
        dto.unitPrice,
        dto.discountPercent,
        dto.discountAmount,
        dto.taxPercent,
        dto.taxAmount,
      );

      const now = BigInt(Date.now());
      const item = await tx.purchaseInvoiceItem.create({
        data: {
          uuid: randomUUID(),
          purchaseInvoiceId,
          goodsReceiptItemId: dto.goodsReceiptItemId,
          medicineId: dto.medicineId,
          batchId: dto.batchId,
          unitId: dto.unitId,
          lineNumber: await getNextLineNumber(
            tx,
            'purchaseInvoiceItem',
            'purchaseInvoiceId',
            purchaseInvoiceId,
          ),
          invoiceQuantity: dto.invoiceQuantity,
          freeQuantity: dto.freeQuantity ?? 0,
          unitPrice: dto.unitPrice,
          mrp: dto.mrp,
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

      await rollupPurchaseInvoiceTotals(tx, purchaseInvoiceId);
      await this.emitParentChange(tx, parent);
      return toPurchaseInvoiceItemResponse(item);
    });
  }

  async update(
    purchaseInvoiceId: bigint,
    id: bigint,
    dto: UpdatePurchaseInvoiceItemDto,
  ) {
    return this.unitOfWork.run(async (tx) => {
      const parent = await this.findParentTx(tx, purchaseInvoiceId);
      assertDraftStatus(
        parent.status,
        'Purchase invoice',
        PurchaseInvoiceStatus.DRAFT,
      );

      const existing = await tx.purchaseInvoiceItem.findFirst({
        where: { id, purchaseInvoiceId, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.PURCHASE_INVOICE_ITEM_NOT_FOUND,
          `Purchase invoice item not found: ${id}`,
          { id: id.toString() },
        );
      }

      const invoiceQuantity = dto.invoiceQuantity ?? existing.invoiceQuantity;
      const unitPrice = dto.unitPrice ?? existing.unitPrice;
      const lineAmounts = computeLineAmounts(
        invoiceQuantity,
        unitPrice,
        dto.discountPercent ?? existing.discountPercent,
        dto.discountAmount ?? existing.discountAmount,
        dto.taxPercent ?? existing.taxPercent,
        dto.taxAmount ?? existing.taxAmount,
      );

      const updateResult = await tx.purchaseInvoiceItem.updateMany({
        where: { id, purchaseInvoiceId, version: dto.version, deletedAt: null },
        data: {
          batchId: dto.batchId,
          unitId: dto.unitId,
          goodsReceiptItemId: dto.goodsReceiptItemId,
          invoiceQuantity: dto.invoiceQuantity,
          freeQuantity: dto.freeQuantity,
          unitPrice: dto.unitPrice,
          mrp: dto.mrp,
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
        `Purchase invoice item version conflict or not found: ${id}`,
      );

      const item = await tx.purchaseInvoiceItem.findFirstOrThrow({
        where: { id },
      });
      await rollupPurchaseInvoiceTotals(tx, purchaseInvoiceId);
      await this.emitParentChange(tx, parent);

      return toPurchaseInvoiceItemResponse(item);
    });
  }

  async delete(purchaseInvoiceId: bigint, id: bigint, version: number) {
    return this.unitOfWork.run(async (tx) => {
      const parent = await this.findParentTx(tx, purchaseInvoiceId);
      assertDraftStatus(
        parent.status,
        'Purchase invoice',
        PurchaseInvoiceStatus.DRAFT,
      );

      const updateResult = await tx.purchaseInvoiceItem.updateMany({
        where: { id, purchaseInvoiceId, version, deletedAt: null },
        data: {
          deletedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Purchase invoice item version conflict or not found: ${id}`,
      );

      await rollupPurchaseInvoiceTotals(tx, purchaseInvoiceId);
      await this.emitParentChange(tx, parent);
      return { id: id.toString(), deleted: true };
    });
  }

  private async findActiveItem(purchaseInvoiceId: bigint, id: bigint) {
    const item = await this.prisma.client.purchaseInvoiceItem.findFirst({
      where: { id, purchaseInvoiceId, deletedAt: null },
    });

    if (!item) {
      throwNotFound(
        ErrorCode.PURCHASE_INVOICE_ITEM_NOT_FOUND,
        `Purchase invoice item not found: ${id}`,
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
      entityType: OutboxEntityType.PURCHASE_INVOICE,
      entityId: parent.id,
      entityUuid: parent.uuid,
      action: AuditAction.UPDATE,
      module: AuditModule.PURCHASE,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.PURCHASE_INVOICE,
      entityUuid: parent.uuid,
      operation: OutboxOperation.UPDATE,
      payload: { uuid: parent.uuid },
    });
  }
}
