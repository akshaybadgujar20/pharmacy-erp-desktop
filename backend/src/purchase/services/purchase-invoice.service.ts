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
import { LedgerPostingService } from '../../persistence/ledger/ledger-posting.service';
import { OutboxEntityType } from '../../persistence/outbox/entity-type.constants';
import { OutboxOperation } from '../../persistence/outbox/outbox-operation.constants';
import { OutboxService } from '../../persistence/outbox/outbox.service';
import { DocumentType } from '../../persistence/sequence/document-type.constants';
import { SequenceGeneratorService } from '../../persistence/sequence/sequence-generator.service';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import { VoucherType } from '../../finance/constants/finance.constants';
import {
  adjustSupplierOutstanding,
  buildPurchaseInvoiceLedgerLines,
} from '../../finance/utils/finance.util';
import {
  PurchaseInvoicePaymentStatus,
  PurchaseInvoiceStatus,
} from '../constants/purchase.constants';
import { CreatePurchaseInvoiceDto } from '../dto/create-purchase-invoice.dto';
import { PurchaseWorkflowDto } from '../dto/purchase-workflow.dto';
import { UpdatePurchaseInvoiceDto } from '../dto/update-purchase-invoice.dto';
import { toPurchaseInvoiceResponse } from '../mappers/purchase-invoice.mapper';
import {
  assertBranchExists,
  assertDraftStatus,
  assertSupplierActive,
  optimisticUpdate,
  throwNotFound,
} from '../utils/purchase.util';

@Injectable()
export class PurchaseInvoiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly requestContext: RequestContextService,
    private readonly sequences: SequenceGeneratorService,
    private readonly ledgerPosting: LedgerPostingService,
  ) {}

  async list(query: PaginationQueryDto) {
    const scope = getTenantScope(this.requestContext);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();

    const where: Prisma.PurchaseInvoiceWhereInput = withBranchScope(scope, {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { purchaseInvoiceNumber: { contains: search } },
              { supplierInvoiceNumber: { contains: search } },
            ],
          }
        : {}),
    });

    const [total, rows] = await Promise.all([
      this.prisma.client.purchaseInvoice.count({ where }),
      this.prisma.client.purchaseInvoice.findMany({
        where,
        orderBy: { invoiceDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toPurchaseInvoiceResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const scope = getTenantScope(this.requestContext);
    const invoice = await this.prisma.client.purchaseInvoice.findFirst({
      where: withBranchScope(scope, { id, deletedAt: null }),
    });

    if (!invoice) {
      throwNotFound(
        ErrorCode.PURCHASE_INVOICE_NOT_FOUND,
        `Purchase invoice not found: ${id}`,
        { id: id.toString() },
      );
    }

    return toPurchaseInvoiceResponse(invoice);
  }

  async create(dto: CreatePurchaseInvoiceDto) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const branch = await assertBranchExists(tx, dto.branchId);

      if (dto.branchId !== scope.branchId) {
        throw new ApplicationException(
          ErrorCode.FORBIDDEN,
          'Purchase invoice branch must match request context branch',
          HttpStatus.FORBIDDEN,
          { branchId: dto.branchId.toString() },
        );
      }

      await assertSupplierActive(tx, dto.supplierId);

      const { documentNumber } = await this.sequences.next(tx, {
        companyId: branch.companyId,
        branchId: branch.id,
        documentType: DocumentType.PURCHASE_INVOICE,
        branchCode: branch.branchCode,
      });

      const now = BigInt(Date.now());
      const invoice = await tx.purchaseInvoice.create({
        data: {
          uuid: randomUUID(),
          purchaseInvoiceNumber: documentNumber,
          supplierInvoiceNumber: dto.supplierInvoiceNumber,
          supplierId: dto.supplierId,
          goodsReceiptId: dto.goodsReceiptId,
          branchId: dto.branchId,
          invoiceDate: dto.invoiceDate,
          dueDate: dto.dueDate,
          grossAmount: 0,
          discountAmount: 0,
          taxAmount: 0,
          roundOffAmount: 0,
          netAmount: 0,
          paidAmount: 0,
          balanceAmount: 0,
          status: PurchaseInvoiceStatus.DRAFT,
          paymentStatus: PurchaseInvoicePaymentStatus.UNPAID,
          remarks: dto.remarks,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.emitChange(
        tx,
        invoice,
        AuditAction.CREATE,
        OutboxOperation.CREATE,
      );
      return toPurchaseInvoiceResponse(invoice);
    });
  }

  async update(id: bigint, dto: UpdatePurchaseInvoiceDto) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const existing = await tx.purchaseInvoice.findFirst({
        where: withBranchScope(scope, { id, deletedAt: null }),
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.PURCHASE_INVOICE_NOT_FOUND,
          `Purchase invoice not found: ${id}`,
          { id: id.toString() },
        );
      }

      assertDraftStatus(
        existing.status,
        'Purchase invoice',
        PurchaseInvoiceStatus.DRAFT,
      );

      if (dto.supplierId) {
        await assertSupplierActive(tx, dto.supplierId);
      }

      const updateResult = await tx.purchaseInvoice.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          supplierId: dto.supplierId,
          supplierInvoiceNumber: dto.supplierInvoiceNumber,
          goodsReceiptId: dto.goodsReceiptId,
          invoiceDate: dto.invoiceDate,
          dueDate: dto.dueDate,
          remarks: dto.remarks,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Purchase invoice version conflict or not found: ${id}`,
      );

      const invoice = await tx.purchaseInvoice.findFirstOrThrow({
        where: { id },
      });
      await this.emitChange(
        tx,
        invoice,
        AuditAction.UPDATE,
        OutboxOperation.UPDATE,
      );
      return toPurchaseInvoiceResponse(invoice);
    });
  }

  async delete(id: bigint, version: number) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const existing = await tx.purchaseInvoice.findFirst({
        where: withBranchScope(scope, { id, deletedAt: null }),
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.PURCHASE_INVOICE_NOT_FOUND,
          `Purchase invoice not found: ${id}`,
          { id: id.toString() },
        );
      }

      assertDraftStatus(
        existing.status,
        'Purchase invoice',
        PurchaseInvoiceStatus.DRAFT,
      );

      const updateResult = await tx.purchaseInvoice.updateMany({
        where: { id, version, deletedAt: null },
        data: {
          deletedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Purchase invoice version conflict or not found: ${id}`,
      );

      await this.emitChange(
        tx,
        existing,
        AuditAction.DELETE,
        OutboxOperation.DELETE,
      );
      return { id: id.toString(), deleted: true };
    });
  }

  async post(id: bigint, dto: PurchaseWorkflowDto) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const invoice = await tx.purchaseInvoice.findFirst({
        where: withBranchScope(scope, { id, deletedAt: null }),
        include: { items: { where: { deletedAt: null } } },
      });

      if (!invoice) {
        throwNotFound(
          ErrorCode.PURCHASE_INVOICE_NOT_FOUND,
          `Purchase invoice not found: ${id}`,
          { id: id.toString() },
        );
      }

      if (invoice.status !== PurchaseInvoiceStatus.DRAFT) {
        throw new ApplicationException(
          ErrorCode.INVALID_DOCUMENT_STATUS,
          'Only draft purchase invoices can be posted',
          HttpStatus.CONFLICT,
          { status: invoice.status },
        );
      }

      if (invoice.items.length === 0) {
        throw new ApplicationException(
          ErrorCode.DOCUMENT_HAS_NO_ITEMS,
          'Purchase invoice must have at least one item',
          HttpStatus.BAD_REQUEST,
          { id: id.toString() },
        );
      }

      let grossAmount = new Prisma.Decimal(0);
      let discountAmount = new Prisma.Decimal(0);
      let taxAmount = new Prisma.Decimal(0);

      for (const item of invoice.items) {
        const lineGross = new Prisma.Decimal(item.invoiceQuantity).mul(
          item.unitPrice,
        );
        grossAmount = grossAmount.add(lineGross);
        discountAmount = discountAmount.add(item.discountAmount);
        taxAmount = taxAmount.add(item.taxAmount);
      }

      const netAmount = grossAmount.sub(discountAmount).add(taxAmount);

      const branch = await tx.branch.findFirstOrThrow({
        where: { id: invoice.branchId, deletedAt: null },
        select: { companyId: true },
      });

      const ledgerLines = await buildPurchaseInvoiceLedgerLines(tx, {
        netAmount,
        taxAmount,
        narration: `Purchase invoice ${invoice.purchaseInvoiceNumber}`,
      });

      await this.ledgerPosting.postVoucher(tx, {
        companyId: branch.companyId,
        voucherType: VoucherType.PURCHASE,
        voucherId: invoice.id,
        voucherNumber: invoice.purchaseInvoiceNumber,
        transactionDate: invoice.invoiceDate,
        lines: ledgerLines,
        createdBy: this.requestContext.tryGet()?.userId,
      });

      await adjustSupplierOutstanding(tx, invoice.supplierId, netAmount);

      const updateResult = await tx.purchaseInvoice.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          status: PurchaseInvoiceStatus.POSTED,
          grossAmount,
          discountAmount,
          taxAmount,
          netAmount,
          balanceAmount: netAmount,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Purchase invoice version conflict or not found: ${id}`,
      );

      const updated = await tx.purchaseInvoice.findFirstOrThrow({
        where: { id },
      });
      await this.emitChange(
        tx,
        updated,
        AuditAction.POST,
        OutboxOperation.UPDATE,
      );
      return toPurchaseInvoiceResponse(updated);
    });
  }

  async cancel(id: bigint, dto: PurchaseWorkflowDto) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const invoice = await tx.purchaseInvoice.findFirst({
        where: withBranchScope(scope, { id, deletedAt: null }),
      });

      if (!invoice) {
        throwNotFound(
          ErrorCode.PURCHASE_INVOICE_NOT_FOUND,
          `Purchase invoice not found: ${id}`,
          { id: id.toString() },
        );
      }

      if (invoice.status !== PurchaseInvoiceStatus.POSTED) {
        throw new ApplicationException(
          ErrorCode.INVALID_DOCUMENT_STATUS,
          'Only posted purchase invoices can be cancelled',
          HttpStatus.CONFLICT,
          { status: invoice.status },
        );
      }

      const branch = await tx.branch.findFirstOrThrow({
        where: { id: invoice.branchId, deletedAt: null },
        select: { companyId: true },
      });

      await this.ledgerPosting.reverseVoucher(tx, {
        companyId: branch.companyId,
        voucherType: VoucherType.PURCHASE,
        voucherId: invoice.id,
        reversalVoucherType: VoucherType.PURCHASE,
        reversalVoucherId: invoice.id,
        reversalVoucherNumber: `${invoice.purchaseInvoiceNumber}-REV`,
        transactionDate: BigInt(Date.now()),
        createdBy: this.requestContext.tryGet()?.userId,
        narration: dto.remarks,
      });

      await adjustSupplierOutstanding(
        tx,
        invoice.supplierId,
        new Prisma.Decimal(invoice.netAmount).neg(),
      );

      const updateResult = await tx.purchaseInvoice.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          status: PurchaseInvoiceStatus.CANCELLED,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Purchase invoice version conflict or not found: ${id}`,
      );

      const updated = await tx.purchaseInvoice.findFirstOrThrow({
        where: { id },
      });
      await this.emitChange(
        tx,
        updated,
        AuditAction.UPDATE,
        OutboxOperation.UPDATE,
      );
      return toPurchaseInvoiceResponse(updated);
    });
  }

  private async emitChange(
    tx: Prisma.TransactionClient,
    invoice: { id: bigint; uuid: string; status?: string },
    action: (typeof AuditAction)[keyof typeof AuditAction],
    operation: (typeof OutboxOperation)[keyof typeof OutboxOperation],
  ) {
    await this.auditService.log(tx, {
      entityType: OutboxEntityType.PURCHASE_INVOICE,
      entityId: invoice.id,
      entityUuid: invoice.uuid,
      action,
      module: AuditModule.PURCHASE,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.PURCHASE_INVOICE,
      entityUuid: invoice.uuid,
      operation,
      payload: { uuid: invoice.uuid, status: invoice.status },
    });
  }
}
