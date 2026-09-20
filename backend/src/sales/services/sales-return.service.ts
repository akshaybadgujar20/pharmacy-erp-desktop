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
import { VoucherType } from '../../finance/constants/finance.constants';
import {
  adjustCustomerOutstanding,
  assertTransactionDateInOpenYear,
  buildSalesRefundLedgerLines,
  buildSalesReturnLedgerLines,
  recomputeSalesInvoiceSettlement,
} from '../../finance/utils/finance.util';
import { StockMovementType } from '../../inventory/constants/inventory.constants';
import {
  getTenantScope,
  withBranchScope,
} from '../../persistence/context/tenant-scope.util';
import { RequestContextService } from '../../persistence/context/request-context.service';
import { InventoryLedgerService } from '../../persistence/inventory/inventory-ledger.service';
import { LedgerPostingService } from '../../persistence/ledger/ledger-posting.service';
import { OutboxEntityType } from '../../persistence/outbox/entity-type.constants';
import { OutboxOperation } from '../../persistence/outbox/outbox-operation.constants';
import { OutboxService } from '../../persistence/outbox/outbox.service';
import { DocumentType } from '../../persistence/sequence/document-type.constants';
import { SequenceGeneratorService } from '../../persistence/sequence/sequence-generator.service';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import { SettingsService } from '../../settings/settings.service';
import {
  SalesInvoiceStatus,
  SalesPaymentStatus,
  SalesReturnDisposition,
  SalesReturnStatus,
} from '../constants/sales.constants';
import { CreateSalesReturnDto } from '../dto/create-sales-return.dto';
import { SalesWorkflowDto } from '../dto/sales-workflow.dto';
import { UpdateSalesReturnDto } from '../dto/update-sales-return.dto';
import { assertBranchExists } from '../../configuration/utils/configuration.util';
import { toSalesReturnResponse } from '../mappers/sales-return.mapper';
import {
  assertCustomerActive,
  assertDraftStatus,
  assertInvoicePosted,
  assertSalesReturnPolicy,
  mapRefundModeToPaymentMethod,
  optimisticUpdate,
  readSalesSettings,
  throwNotFound,
} from '../utils/sales.util';

@Injectable()
export class SalesReturnService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly requestContext: RequestContextService,
    private readonly sequences: SequenceGeneratorService,
    private readonly inventoryLedger: InventoryLedgerService,
    private readonly ledgerPosting: LedgerPostingService,
    private readonly settingsService: SettingsService,
  ) {}

  async list(query: PaginationQueryDto) {
    const scope = getTenantScope(this.requestContext);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();

    const where: Prisma.SalesReturnWhereInput = withBranchScope(scope, {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { salesReturnNumber: { contains: search } },
              { returnReason: { contains: search } },
            ],
          }
        : {}),
    });

    const [total, rows] = await Promise.all([
      this.prisma.client.salesReturn.count({ where }),
      this.prisma.client.salesReturn.findMany({
        where,
        orderBy: { returnDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toSalesReturnResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const scope = getTenantScope(this.requestContext);
    const salesReturn = await this.prisma.client.salesReturn.findFirst({
      where: withBranchScope(scope, { id, deletedAt: null }),
    });

    if (!salesReturn) {
      throwNotFound(
        ErrorCode.SALES_RETURN_NOT_FOUND,
        `Sales return not found: ${id}`,
        { id: id.toString() },
      );
    }

    return toSalesReturnResponse(salesReturn);
  }

  async create(dto: CreateSalesReturnDto) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const branch = await assertBranchExists(tx, dto.branchId);

      if (dto.branchId !== scope.branchId) {
        throw new ApplicationException(
          ErrorCode.FORBIDDEN,
          'Sales return branch must match request context branch',
          HttpStatus.FORBIDDEN,
          { branchId: dto.branchId.toString() },
        );
      }

      const invoice = await tx.salesInvoice.findFirst({
        where: withBranchScope(scope, {
          id: dto.salesInvoiceId,
          deletedAt: null,
        }),
      });

      if (!invoice) {
        throwNotFound(
          ErrorCode.SALES_INVOICE_NOT_FOUND,
          `Sales invoice not found: ${dto.salesInvoiceId}`,
          { salesInvoiceId: dto.salesInvoiceId.toString() },
        );
      }

      assertInvoicePosted(invoice.status);

      if (dto.customerId) {
        await assertCustomerActive(tx, dto.customerId);
      }

      const { documentNumber } = await this.sequences.next(tx, {
        companyId: branch.companyId,
        branchId: branch.id,
        documentType: DocumentType.SALES_RETURN,
        branchCode: branch.branchCode,
      });

      const now = BigInt(Date.now());
      const salesReturn = await tx.salesReturn.create({
        data: {
          uuid: randomUUID(),
          salesReturnNumber: documentNumber,
          salesInvoiceId: dto.salesInvoiceId,
          customerId: dto.customerId ?? invoice.customerId,
          branchId: dto.branchId,
          returnDate: dto.returnDate,
          returnReason: dto.returnReason,
          status: SalesReturnStatus.DRAFT,
          grossAmount: 0,
          discountAmount: 0,
          taxAmount: 0,
          roundOffAmount: 0,
          netAmount: 0,
          refundAmount: 0,
          remarks: dto.remarks,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.emitChange(
        tx,
        salesReturn,
        AuditAction.CREATE,
        OutboxOperation.CREATE,
      );
      return toSalesReturnResponse(salesReturn);
    });
  }

  async update(id: bigint, dto: UpdateSalesReturnDto) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const existing = await tx.salesReturn.findFirst({
        where: withBranchScope(scope, { id, deletedAt: null }),
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.SALES_RETURN_NOT_FOUND,
          `Sales return not found: ${id}`,
          { id: id.toString() },
        );
      }

      assertDraftStatus(existing.status, 'Sales return');

      if (dto.customerId) {
        await assertCustomerActive(tx, dto.customerId);
      }

      const updateResult = await tx.salesReturn.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          customerId: dto.customerId,
          returnDate: dto.returnDate,
          returnReason: dto.returnReason,
          refundMode: dto.refundMode,
          creditNoteNumber: dto.creditNoteNumber,
          remarks: dto.remarks,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Sales return version conflict or not found: ${id}`,
      );

      const salesReturn = await tx.salesReturn.findFirstOrThrow({
        where: { id },
      });
      await this.emitChange(
        tx,
        salesReturn,
        AuditAction.UPDATE,
        OutboxOperation.UPDATE,
      );
      return toSalesReturnResponse(salesReturn);
    });
  }

  async delete(id: bigint, version: number) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const existing = await tx.salesReturn.findFirst({
        where: withBranchScope(scope, { id, deletedAt: null }),
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.SALES_RETURN_NOT_FOUND,
          `Sales return not found: ${id}`,
          { id: id.toString() },
        );
      }

      assertDraftStatus(existing.status, 'Sales return');

      const updateResult = await tx.salesReturn.updateMany({
        where: { id, version, deletedAt: null },
        data: {
          deletedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Sales return version conflict or not found: ${id}`,
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

  async approve(id: bigint, dto: SalesWorkflowDto) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const salesReturn = await tx.salesReturn.findFirst({
        where: withBranchScope(scope, { id, deletedAt: null }),
        include: { items: { where: { deletedAt: null } } },
      });

      if (!salesReturn) {
        throwNotFound(
          ErrorCode.SALES_RETURN_NOT_FOUND,
          `Sales return not found: ${id}`,
          { id: id.toString() },
        );
      }

      if (salesReturn.status !== SalesReturnStatus.DRAFT) {
        throw new ApplicationException(
          ErrorCode.INVALID_DOCUMENT_STATUS,
          'Only draft sales returns can be approved',
          HttpStatus.CONFLICT,
          { status: salesReturn.status },
        );
      }

      if (salesReturn.items.length === 0) {
        throw new ApplicationException(
          ErrorCode.DOCUMENT_HAS_NO_ITEMS,
          'Sales return must have at least one item',
          HttpStatus.BAD_REQUEST,
          { id: id.toString() },
        );
      }

      const branch = await assertBranchExists(tx, salesReturn.branchId);
      const salesSettings = await readSalesSettings(this.settingsService);
      const invoice = await tx.salesInvoice.findFirstOrThrow({
        where: { id: salesReturn.salesInvoiceId },
      });

      await assertSalesReturnPolicy(tx, {
        invoiceDate: invoice.invoiceDate,
        returnDate: salesReturn.returnDate,
        returnWindowDays: salesSettings.returnWindowDays,
        items: salesReturn.items,
        returnRequiresPharmacistForScheduleH:
          salesSettings.returnRequiresPharmacistForScheduleH,
        approvedByEmployeeId: salesReturn.approvedByEmployeeId,
      });

      const userId = this.requestContext.tryGet()?.userId;
      let grossAmount = new Prisma.Decimal(0);
      let discountAmount = new Prisma.Decimal(0);
      let taxAmount = new Prisma.Decimal(0);

      for (const item of salesReturn.items) {
        if (item.disposition !== SalesReturnDisposition.RESTOCK) {
          throw new ApplicationException(
            ErrorCode.BAD_REQUEST,
            'Only RESTOCK disposition is supported',
            HttpStatus.BAD_REQUEST,
            { disposition: item.disposition },
          );
        }

        const batch = await tx.batch.findFirstOrThrow({
          where: { id: item.batchId, deletedAt: null },
        });

        if (
          !salesSettings.allowExpiredCustomerReturn &&
          batch.expiryDate < salesReturn.returnDate
        ) {
          throw new ApplicationException(
            ErrorCode.BATCH_EXPIRED,
            `Batch is expired: ${item.batchId}`,
            HttpStatus.CONFLICT,
            { batchId: item.batchId.toString() },
          );
        }

        await this.inventoryLedger.applyMovement(tx, {
          branchId: salesReturn.branchId,
          branchCode: branch.branchCode,
          companyId: branch.companyId,
          medicineId: item.medicineId,
          batchId: item.batchId,
          direction: 'IN',
          quantity: item.returnQuantity,
          unitCost: item.unitPrice,
          movementType: StockMovementType.SALES_RETURN,
          referenceTable: 'sales_returns',
          referenceId: salesReturn.id,
          createdBy: userId,
          remarks: dto.remarks ?? item.remarks ?? undefined,
        });

        grossAmount = grossAmount.add(
          new Prisma.Decimal(item.returnQuantity).mul(item.unitPrice),
        );
        discountAmount = discountAmount.add(item.discountAmount);
        taxAmount = taxAmount.add(item.taxAmount);
      }

      const netAmount = grossAmount.sub(discountAmount).add(taxAmount);

      await assertTransactionDateInOpenYear(
        tx,
        branch.companyId,
        salesReturn.returnDate,
      );

      const ledgerLines = await buildSalesReturnLedgerLines(tx, {
        netAmount,
        taxAmount,
        customerId: invoice.customerId,
        narration: `Sales return ${salesReturn.salesReturnNumber}`,
      });

      await this.ledgerPosting.postVoucher(tx, {
        companyId: branch.companyId,
        voucherType: VoucherType.SALES,
        voucherId: salesReturn.id,
        voucherNumber: salesReturn.salesReturnNumber,
        transactionDate: salesReturn.returnDate,
        lines: ledgerLines,
        createdBy: userId,
      });

      const now = BigInt(Date.now());
      const updateResult = await tx.salesReturn.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          status: SalesReturnStatus.COMPLETED,
          grossAmount,
          discountAmount,
          taxAmount,
          netAmount,
          refundAmount: netAmount,
          approvedByEmployeeId: userId,
          approvedAt: now,
          updatedAt: now,
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Sales return version conflict or not found: ${id}`,
      );

      if (invoice.customerId) {
        await adjustCustomerOutstanding(
          tx,
          invoice.customerId,
          netAmount.neg(),
        );
      }

      if (salesReturn.refundMode && netAmount.gt(0) && invoice.customerId) {
        await this.createRefundPayment(
          tx,
          salesReturn,
          invoice.customerId,
          branch,
          netAmount,
          userId,
        );
      }

      await recomputeSalesInvoiceSettlement(tx, salesReturn.salesInvoiceId);
      await this.updateInvoiceReturnStatus(tx, salesReturn.salesInvoiceId);

      const updated = await tx.salesReturn.findFirstOrThrow({ where: { id } });
      await this.emitChange(
        tx,
        updated,
        AuditAction.APPROVE,
        OutboxOperation.UPDATE,
      );
      return toSalesReturnResponse(updated);
    });
  }

  async cancel(id: bigint, dto: SalesWorkflowDto) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const salesReturn = await tx.salesReturn.findFirst({
        where: withBranchScope(scope, { id, deletedAt: null }),
        include: { items: { where: { deletedAt: null } } },
      });

      if (!salesReturn) {
        throwNotFound(
          ErrorCode.SALES_RETURN_NOT_FOUND,
          `Sales return not found: ${id}`,
          { id: id.toString() },
        );
      }

      if (
        salesReturn.status !== SalesReturnStatus.DRAFT &&
        salesReturn.status !== SalesReturnStatus.COMPLETED
      ) {
        throw new ApplicationException(
          ErrorCode.INVALID_DOCUMENT_STATUS,
          'Only draft or completed sales returns can be cancelled',
          HttpStatus.CONFLICT,
          { status: salesReturn.status },
        );
      }

      if (salesReturn.status === SalesReturnStatus.COMPLETED) {
        const branch = await assertBranchExists(tx, salesReturn.branchId);
        const userId = this.requestContext.tryGet()?.userId;
        const netAmount = new Prisma.Decimal(salesReturn.netAmount);

        await this.ledgerPosting.reverseVoucher(tx, {
          companyId: branch.companyId,
          originalVoucherType: VoucherType.SALES,
          originalVoucherId: salesReturn.id,
          originalVoucherNumber: salesReturn.salesReturnNumber,
          reversalVoucherType: VoucherType.SALES,
          reversalVoucherId: salesReturn.id,
          reversalVoucherNumber: `${salesReturn.salesReturnNumber}-REV`,
          transactionDate: BigInt(Date.now()),
          createdBy: userId,
          narration: dto.remarks,
        });

        for (const item of salesReturn.items) {
          if (item.disposition !== SalesReturnDisposition.RESTOCK) {
            continue;
          }

          await this.inventoryLedger.applyMovement(tx, {
            branchId: salesReturn.branchId,
            branchCode: branch.branchCode,
            companyId: branch.companyId,
            medicineId: item.medicineId,
            batchId: item.batchId,
            direction: 'OUT',
            quantity: item.returnQuantity,
            unitCost: item.unitPrice,
            movementType: StockMovementType.SALES_RETURN,
            referenceTable: 'sales_returns',
            referenceId: salesReturn.id,
            createdBy: userId,
            remarks: dto.remarks ?? 'Sales return cancellation reversal',
          });
        }

        const invoice = await tx.salesInvoice.findFirstOrThrow({
          where: { id: salesReturn.salesInvoiceId },
        });

        if (invoice.customerId) {
          await adjustCustomerOutstanding(tx, invoice.customerId, netAmount);
        }

        await this.reverseRefundPayment(
          tx,
          salesReturn,
          invoice.customerId,
          branch,
          dto.remarks,
        );

        await recomputeSalesInvoiceSettlement(tx, salesReturn.salesInvoiceId);
        await this.updateInvoiceReturnStatus(tx, salesReturn.salesInvoiceId);
      }

      const updateResult = await tx.salesReturn.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          status: SalesReturnStatus.CANCELLED,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Sales return version conflict or not found: ${id}`,
      );

      const updated = await tx.salesReturn.findFirstOrThrow({ where: { id } });
      await this.emitChange(
        tx,
        updated,
        AuditAction.UPDATE,
        OutboxOperation.UPDATE,
      );
      return toSalesReturnResponse(updated);
    });
  }

  private async reverseRefundPayment(
    tx: Prisma.TransactionClient,
    salesReturn: {
      id: bigint;
      salesReturnNumber: string;
      salesInvoiceId: bigint;
      refundMode: string | null;
    },
    customerId: bigint | null,
    branch: { companyId: bigint },
    remarks?: string,
  ): Promise<void> {
    if (!salesReturn.refundMode || !customerId) {
      return;
    }

    const payment = await tx.salesPayment.findFirst({
      where: {
        salesInvoiceId: salesReturn.salesInvoiceId,
        status: SalesPaymentStatus.REFUNDED,
        deletedAt: null,
        remarks: `Refund for ${salesReturn.salesReturnNumber}`,
      },
    });

    if (!payment) {
      return;
    }

    const userId = this.requestContext.tryGet()?.userId;
    await this.ledgerPosting.reverseVoucher(tx, {
      companyId: branch.companyId,
      originalVoucherType: VoucherType.PAYMENT,
      originalVoucherId: payment.id,
      originalVoucherNumber: payment.paymentNumber,
      reversalVoucherType: VoucherType.PAYMENT,
      reversalVoucherId: payment.id,
      reversalVoucherNumber: `${payment.paymentNumber}-REV`,
      transactionDate: BigInt(Date.now()),
      createdBy: userId,
      narration:
        remarks ?? `Reverse refund for ${salesReturn.salesReturnNumber}`,
    });

    await tx.salesPayment.update({
      where: { id: payment.id },
      data: {
        status: SalesPaymentStatus.CANCELLED,
        updatedAt: BigInt(Date.now()),
        version: { increment: 1 },
      },
    });
  }

  private async createRefundPayment(
    tx: Prisma.TransactionClient,
    salesReturn: {
      id: bigint;
      salesReturnNumber: string;
      salesInvoiceId: bigint;
      branchId: bigint;
      returnDate: bigint;
      refundMode: string | null;
    },
    customerId: bigint,
    branch: { companyId: bigint; id: bigint; branchCode: string },
    netAmount: Prisma.Decimal,
    userId: bigint | undefined,
  ): Promise<void> {
    if (!salesReturn.refundMode) {
      return;
    }

    const paymentMethod = mapRefundModeToPaymentMethod(salesReturn.refundMode);
    const { documentNumber } = await this.sequences.next(tx, {
      companyId: branch.companyId,
      branchId: branch.id,
      documentType: DocumentType.SALES_PAYMENT,
      branchCode: branch.branchCode,
    });

    const now = BigInt(Date.now());
    const payment = await tx.salesPayment.create({
      data: {
        uuid: randomUUID(),
        paymentNumber: documentNumber,
        salesInvoiceId: salesReturn.salesInvoiceId,
        branchId: salesReturn.branchId,
        paymentDate: salesReturn.returnDate,
        paymentMethod,
        paymentAmount: netAmount,
        status: SalesPaymentStatus.REFUNDED,
        remarks: `Refund for ${salesReturn.salesReturnNumber}`,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      },
    });

    const lines = await buildSalesRefundLedgerLines(tx, {
      amount: netAmount,
      paymentMethod,
      customerId,
      narration: payment.remarks ?? undefined,
    });

    await this.ledgerPosting.postVoucher(tx, {
      companyId: branch.companyId,
      voucherType: VoucherType.PAYMENT,
      voucherId: payment.id,
      voucherNumber: payment.paymentNumber,
      transactionDate: salesReturn.returnDate,
      lines,
      createdBy: userId,
    });
  }

  private async updateInvoiceReturnStatus(
    tx: Prisma.TransactionClient,
    salesInvoiceId: bigint,
  ): Promise<void> {
    const invoice = await tx.salesInvoice.findFirstOrThrow({
      where: { id: salesInvoiceId },
      include: { items: { where: { deletedAt: null } } },
    });

    const returnedByItem = new Map<string, Prisma.Decimal>();

    const returnItems = await tx.salesReturnItem.findMany({
      where: {
        deletedAt: null,
        salesReturn: {
          salesInvoiceId,
          status: SalesReturnStatus.COMPLETED,
          deletedAt: null,
        },
      },
      select: { salesInvoiceItemId: true, returnQuantity: true },
    });

    for (const row of returnItems) {
      const key = row.salesInvoiceItemId.toString();
      const current = returnedByItem.get(key) ?? new Prisma.Decimal(0);
      returnedByItem.set(
        key,
        current.add(new Prisma.Decimal(row.returnQuantity)),
      );
    }

    let fullyReturned = true;
    const anyReturned = returnItems.length > 0;

    for (const item of invoice.items) {
      const returned =
        returnedByItem.get(item.id.toString()) ?? new Prisma.Decimal(0);
      const sold = new Prisma.Decimal(item.soldQuantity);
      if (returned.lt(sold)) {
        fullyReturned = false;
      }
    }

    let nextStatus: string = SalesInvoiceStatus.POSTED;
    if (fullyReturned && anyReturned) {
      nextStatus = SalesInvoiceStatus.RETURNED;
    } else if (anyReturned) {
      nextStatus = SalesInvoiceStatus.PARTIALLY_RETURNED;
    }

    if (nextStatus !== invoice.status) {
      await tx.salesInvoice.update({
        where: { id: salesInvoiceId },
        data: { status: nextStatus, updatedAt: BigInt(Date.now()) },
      });
    }
  }

  private async emitChange(
    tx: Prisma.TransactionClient,
    salesReturn: { id: bigint; uuid: string; status?: string },
    action: (typeof AuditAction)[keyof typeof AuditAction],
    operation: (typeof OutboxOperation)[keyof typeof OutboxOperation],
  ) {
    await this.auditService.log(tx, {
      entityType: OutboxEntityType.SALES_RETURN,
      entityId: salesReturn.id,
      entityUuid: salesReturn.uuid,
      action,
      module: AuditModule.SALES,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.SALES_RETURN,
      entityUuid: salesReturn.uuid,
      operation,
      payload: { uuid: salesReturn.uuid, status: salesReturn.status },
    });
  }
}
