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
import { SalesReturnDisposition } from '../constants/sales.constants';
import { CreateSalesReturnItemDto } from '../dto/create-sales-return-item.dto';
import { UpdateSalesReturnItemDto } from '../dto/update-sales-return-item.dto';
import { toSalesReturnItemResponse } from '../mappers/sales-return-item.mapper';
import {
  assertDraftStatus,
  assertMedicineExists,
  assertRestockDisposition,
  assertReturnItemMatchesInvoiceLine,
  assertReturnQuantityWithinSold,
  computeLineAmounts,
  getNextLineNumber,
  optimisticUpdate,
  throwConflict,
  throwNotFound,
} from '../utils/sales.util';

@Injectable()
export class SalesReturnItemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly requestContext: RequestContextService,
  ) {}

  private async findParent(salesReturnId: bigint) {
    const scope = getTenantScope(this.requestContext);
    const salesReturn = await this.prisma.client.salesReturn.findFirst({
      where: withBranchScope(scope, { id: salesReturnId, deletedAt: null }),
    });

    if (!salesReturn) {
      throwNotFound(
        ErrorCode.SALES_RETURN_NOT_FOUND,
        `Sales return not found: ${salesReturnId}`,
        { salesReturnId: salesReturnId.toString() },
      );
    }

    return salesReturn;
  }

  private async findParentTx(
    tx: Prisma.TransactionClient,
    salesReturnId: bigint,
  ) {
    const scope = getTenantScope(this.requestContext);
    const salesReturn = await tx.salesReturn.findFirst({
      where: withBranchScope(scope, { id: salesReturnId, deletedAt: null }),
    });

    if (!salesReturn) {
      throwNotFound(
        ErrorCode.SALES_RETURN_NOT_FOUND,
        `Sales return not found: ${salesReturnId}`,
        { salesReturnId: salesReturnId.toString() },
      );
    }

    return salesReturn;
  }

  async list(salesReturnId: bigint, query: PaginationQueryDto) {
    await this.findParent(salesReturnId);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.SalesReturnItemWhereInput = {
      salesReturnId,
      deletedAt: null,
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.salesReturnItem.count({ where }),
      this.prisma.client.salesReturnItem.findMany({
        where,
        orderBy: { lineNumber: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toSalesReturnItemResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(salesReturnId: bigint, id: bigint) {
    await this.findParent(salesReturnId);
    const item = await this.findActiveItem(salesReturnId, id);
    return toSalesReturnItemResponse(item);
  }

  async create(salesReturnId: bigint, dto: CreateSalesReturnItemDto) {
    return this.unitOfWork.run(async (tx) => {
      const parent = await this.findParentTx(tx, salesReturnId);
      assertDraftStatus(parent.status, 'Sales return');

      const disposition = dto.disposition ?? SalesReturnDisposition.RESTOCK;
      assertRestockDisposition(disposition);

      await assertMedicineExists(tx, dto.medicineId);
      await assertReturnItemMatchesInvoiceLine(
        tx,
        dto.salesInvoiceItemId,
        dto.medicineId,
        dto.batchId,
      );
      await assertReturnQuantityWithinSold(
        tx,
        dto.salesInvoiceItemId,
        new Prisma.Decimal(dto.returnQuantity),
        salesReturnId,
      );

      const duplicate = await tx.salesReturnItem.findFirst({
        where: { salesReturnId, batchId: dto.batchId, deletedAt: null },
      });

      if (duplicate) {
        throwConflict(`Batch already exists on sales return: ${dto.batchId}`, {
          batchId: dto.batchId.toString(),
        });
      }

      const lineAmounts = computeLineAmounts(
        dto.returnQuantity,
        dto.unitPrice,
        dto.discountPercent,
        dto.discountAmount,
        dto.taxPercent,
        dto.taxAmount,
      );

      const now = BigInt(Date.now());
      const item = await tx.salesReturnItem.create({
        data: {
          uuid: randomUUID(),
          salesReturnId,
          salesInvoiceItemId: dto.salesInvoiceItemId,
          medicineId: dto.medicineId,
          batchId: dto.batchId,
          unitId: dto.unitId,
          lineNumber: await getNextLineNumber(
            tx,
            'salesReturnItem',
            'salesReturnId',
            salesReturnId,
          ),
          returnQuantity: dto.returnQuantity,
          unitPrice: dto.unitPrice,
          discountPercent: dto.discountPercent,
          discountAmount: lineAmounts.discountAmount,
          taxPercent: dto.taxPercent,
          taxAmount: lineAmounts.taxAmount,
          lineAmount: lineAmounts.lineAmount,
          returnReason: dto.returnReason,
          disposition,
          remarks: dto.remarks,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.emitParentChange(tx, parent);
      return toSalesReturnItemResponse(item);
    });
  }

  async update(
    salesReturnId: bigint,
    id: bigint,
    dto: UpdateSalesReturnItemDto,
  ) {
    return this.unitOfWork.run(async (tx) => {
      const parent = await this.findParentTx(tx, salesReturnId);
      assertDraftStatus(parent.status, 'Sales return');

      const existing = await tx.salesReturnItem.findFirst({
        where: { id, salesReturnId, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.SALES_RETURN_ITEM_NOT_FOUND,
          `Sales return item not found: ${id}`,
          { id: id.toString() },
        );
      }

      if (dto.disposition) {
        assertRestockDisposition(dto.disposition);
      }

      const returnQuantity = dto.returnQuantity ?? existing.returnQuantity;
      const unitPrice = dto.unitPrice ?? existing.unitPrice;

      if (dto.batchId != null) {
        await assertReturnItemMatchesInvoiceLine(
          tx,
          existing.salesInvoiceItemId,
          existing.medicineId,
          dto.batchId,
        );
      }

      if (dto.returnQuantity) {
        await assertReturnQuantityWithinSold(
          tx,
          existing.salesInvoiceItemId,
          new Prisma.Decimal(returnQuantity),
          salesReturnId,
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

      const updateResult = await tx.salesReturnItem.updateMany({
        where: { id, salesReturnId, version: dto.version, deletedAt: null },
        data: {
          batchId: dto.batchId,
          unitId: dto.unitId,
          returnQuantity: dto.returnQuantity,
          unitPrice: dto.unitPrice,
          discountPercent: dto.discountPercent,
          discountAmount: lineAmounts.discountAmount,
          taxPercent: dto.taxPercent,
          taxAmount: lineAmounts.taxAmount,
          lineAmount: lineAmounts.lineAmount,
          returnReason: dto.returnReason,
          disposition: dto.disposition,
          remarks: dto.remarks,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Sales return item version conflict or not found: ${id}`,
      );

      const item = await tx.salesReturnItem.findFirstOrThrow({ where: { id } });
      await this.emitParentChange(tx, parent);
      return toSalesReturnItemResponse(item);
    });
  }

  async delete(salesReturnId: bigint, id: bigint, version: bigint) {
    return this.unitOfWork.run(async (tx) => {
      const parent = await this.findParentTx(tx, salesReturnId);
      assertDraftStatus(parent.status, 'Sales return');

      const updateResult = await tx.salesReturnItem.updateMany({
        where: { id, salesReturnId, version, deletedAt: null },
        data: {
          deletedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Sales return item version conflict or not found: ${id}`,
      );

      await this.emitParentChange(tx, parent);
      return { id: id.toString(), deleted: true };
    });
  }

  private async findActiveItem(salesReturnId: bigint, id: bigint) {
    const item = await this.prisma.client.salesReturnItem.findFirst({
      where: { id, salesReturnId, deletedAt: null },
    });

    if (!item) {
      throwNotFound(
        ErrorCode.SALES_RETURN_ITEM_NOT_FOUND,
        `Sales return item not found: ${id}`,
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
      entityType: OutboxEntityType.SALES_RETURN,
      entityId: parent.id,
      entityUuid: parent.uuid,
      action: AuditAction.UPDATE,
      module: AuditModule.SALES,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.SALES_RETURN,
      entityUuid: parent.uuid,
      operation: OutboxOperation.UPDATE,
      payload: { uuid: parent.uuid },
    });
  }
}
