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
import { CreateSalesInvoiceItemDto } from '../dto/create-sales-invoice-item.dto';
import { UpdateSalesInvoiceItemDto } from '../dto/update-sales-invoice-item.dto';
import { toSalesInvoiceItemResponse } from '../mappers/sales-invoice-item.mapper';
import {
  assertDraftStatus,
  assertMedicineExists,
  computeLineAmounts,
  getNextLineNumber,
  optimisticUpdate,
  throwConflict,
  throwNotFound,
} from '../utils/sales.util';

@Injectable()
export class SalesInvoiceItemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly requestContext: RequestContextService,
  ) {}

  private async findParent(salesInvoiceId: bigint) {
    const scope = getTenantScope(this.requestContext);
    const invoice = await this.prisma.client.salesInvoice.findFirst({
      where: withBranchScope(scope, { id: salesInvoiceId, deletedAt: null }),
    });

    if (!invoice) {
      throwNotFound(
        ErrorCode.SALES_INVOICE_NOT_FOUND,
        `Sales invoice not found: ${salesInvoiceId}`,
        { salesInvoiceId: salesInvoiceId.toString() },
      );
    }

    return invoice;
  }

  private async findParentTx(
    tx: Prisma.TransactionClient,
    salesInvoiceId: bigint,
  ) {
    const scope = getTenantScope(this.requestContext);
    const invoice = await tx.salesInvoice.findFirst({
      where: withBranchScope(scope, { id: salesInvoiceId, deletedAt: null }),
    });

    if (!invoice) {
      throwNotFound(
        ErrorCode.SALES_INVOICE_NOT_FOUND,
        `Sales invoice not found: ${salesInvoiceId}`,
        { salesInvoiceId: salesInvoiceId.toString() },
      );
    }

    return invoice;
  }

  async list(salesInvoiceId: bigint, query: PaginationQueryDto) {
    await this.findParent(salesInvoiceId);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.SalesInvoiceItemWhereInput = {
      salesInvoiceId,
      deletedAt: null,
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.salesInvoiceItem.count({ where }),
      this.prisma.client.salesInvoiceItem.findMany({
        where,
        orderBy: { lineNumber: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toSalesInvoiceItemResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(salesInvoiceId: bigint, id: bigint) {
    await this.findParent(salesInvoiceId);
    const item = await this.findActiveItem(salesInvoiceId, id);
    return toSalesInvoiceItemResponse(item);
  }

  async create(salesInvoiceId: bigint, dto: CreateSalesInvoiceItemDto) {
    return this.unitOfWork.run(async (tx) => {
      const parent = await this.findParentTx(tx, salesInvoiceId);
      assertDraftStatus(parent.status, 'Sales invoice');

      await assertMedicineExists(tx, dto.medicineId);

      const batch = await tx.batch.findFirst({
        where: { id: dto.batchId, deletedAt: null },
      });

      if (!batch) {
        throwNotFound(
          ErrorCode.BATCH_NOT_FOUND,
          `Batch not found: ${dto.batchId}`,
          { batchId: dto.batchId.toString() },
        );
      }

      const duplicate = await tx.salesInvoiceItem.findFirst({
        where: { salesInvoiceId, batchId: dto.batchId, deletedAt: null },
      });

      if (duplicate) {
        throwConflict(`Batch already exists on sales invoice: ${dto.batchId}`, {
          batchId: dto.batchId.toString(),
        });
      }

      const lineAmounts = computeLineAmounts(
        dto.soldQuantity,
        0,
        dto.discountPercent,
        dto.discountAmount,
        dto.taxPercent,
        dto.taxAmount,
      );

      const now = BigInt(Date.now());
      const item = await tx.salesInvoiceItem.create({
        data: {
          uuid: randomUUID(),
          salesInvoiceId,
          medicineId: dto.medicineId,
          batchId: dto.batchId,
          unitId: dto.unitId,
          lineNumber: await getNextLineNumber(
            tx,
            'salesInvoiceItem',
            'salesInvoiceId',
            salesInvoiceId,
          ),
          soldQuantity: dto.soldQuantity,
          mrp: batch.mrp,
          unitPrice: 0,
          purchaseRate: batch.purchaseRate,
          conversionFactor: dto.conversionFactor ?? 1,
          discountPercent: dto.discountPercent,
          discountAmount: lineAmounts.discountAmount,
          taxPercent: dto.taxPercent,
          taxAmount: lineAmounts.taxAmount,
          taxId: dto.taxId,
          lineAmount: lineAmounts.lineAmount,
          remarks: dto.remarks,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.emitParentChange(tx, parent);
      return toSalesInvoiceItemResponse(item);
    });
  }

  async update(
    salesInvoiceId: bigint,
    id: bigint,
    dto: UpdateSalesInvoiceItemDto,
  ) {
    return this.unitOfWork.run(async (tx) => {
      const parent = await this.findParentTx(tx, salesInvoiceId);
      assertDraftStatus(parent.status, 'Sales invoice');

      const existing = await tx.salesInvoiceItem.findFirst({
        where: { id, salesInvoiceId, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.SALES_INVOICE_ITEM_NOT_FOUND,
          `Sales invoice item not found: ${id}`,
          { id: id.toString() },
        );
      }

      const soldQuantity = dto.soldQuantity ?? existing.soldQuantity;
      const lineAmounts = computeLineAmounts(
        soldQuantity,
        existing.unitPrice,
        dto.discountPercent ?? existing.discountPercent,
        dto.discountAmount ?? existing.discountAmount,
        dto.taxPercent ?? existing.taxPercent,
        dto.taxAmount ?? existing.taxAmount,
      );

      const updateResult = await tx.salesInvoiceItem.updateMany({
        where: { id, salesInvoiceId, version: dto.version, deletedAt: null },
        data: {
          batchId: dto.batchId,
          unitId: dto.unitId,
          soldQuantity: dto.soldQuantity,
          conversionFactor: dto.conversionFactor,
          discountPercent: dto.discountPercent,
          discountAmount: lineAmounts.discountAmount,
          taxPercent: dto.taxPercent,
          taxAmount: lineAmounts.taxAmount,
          taxId: dto.taxId,
          lineAmount: lineAmounts.lineAmount,
          remarks: dto.remarks,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Sales invoice item version conflict or not found: ${id}`,
      );

      const item = await tx.salesInvoiceItem.findFirstOrThrow({
        where: { id },
      });
      await this.emitParentChange(tx, parent);
      return toSalesInvoiceItemResponse(item);
    });
  }

  async delete(salesInvoiceId: bigint, id: bigint, version: number) {
    return this.unitOfWork.run(async (tx) => {
      const parent = await this.findParentTx(tx, salesInvoiceId);
      assertDraftStatus(parent.status, 'Sales invoice');

      const updateResult = await tx.salesInvoiceItem.updateMany({
        where: { id, salesInvoiceId, version, deletedAt: null },
        data: {
          deletedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Sales invoice item version conflict or not found: ${id}`,
      );

      await this.emitParentChange(tx, parent);
      return { id: id.toString(), deleted: true };
    });
  }

  private async findActiveItem(salesInvoiceId: bigint, id: bigint) {
    const item = await this.prisma.client.salesInvoiceItem.findFirst({
      where: { id, salesInvoiceId, deletedAt: null },
    });

    if (!item) {
      throwNotFound(
        ErrorCode.SALES_INVOICE_ITEM_NOT_FOUND,
        `Sales invoice item not found: ${id}`,
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
      entityType: OutboxEntityType.SALES_INVOICE,
      entityId: parent.id,
      entityUuid: parent.uuid,
      action: AuditAction.UPDATE,
      module: AuditModule.SALES,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.SALES_INVOICE,
      entityUuid: parent.uuid,
      operation: OutboxOperation.UPDATE,
      payload: { uuid: parent.uuid },
    });
  }
}
