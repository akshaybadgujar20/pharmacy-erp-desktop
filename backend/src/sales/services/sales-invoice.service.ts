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
} from '../../finance/utils/finance.util';
import { buildSalesInvoiceLedgerLines } from '../utils/sales.util';
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
  SALES_INVOICE_CANCELLABLE_STATUSES,
  SalesInvoicePaymentStatus,
  SalesInvoiceStatus,
  SalesPaymentMode,
  SalesReturnStatus,
} from '../constants/sales.constants';
import { CreateSalesInvoiceDto } from '../dto/create-sales-invoice.dto';
import { SalesWorkflowDto } from '../dto/sales-workflow.dto';
import { UpdateSalesInvoiceDto } from '../dto/update-sales-invoice.dto';
import { toSalesInvoiceResponse } from '../mappers/sales-invoice.mapper';
import { assertBranchExists } from '../../configuration/utils/configuration.util';
import {
  allocateFefoBatches,
  assertCustomerActive,
  assertDraftStatus,
  assertPrescriptionExists,
  computeLineAmounts,
  computeNetSoldQuantitiesByItem,
  getNextLineNumber,
  optimisticUpdate,
  readSalesSettings,
  resolvePriceListItem,
  throwNotFound,
} from '../utils/sales.util';

@Injectable()
export class SalesInvoiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly requestContext: RequestContextService,
    private readonly sequences: SequenceGeneratorService,
    private readonly ledgerPosting: LedgerPostingService,
    private readonly inventoryLedger: InventoryLedgerService,
    private readonly settingsService: SettingsService,
  ) {}

  async list(query: PaginationQueryDto) {
    const scope = getTenantScope(this.requestContext);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();

    const where: Prisma.SalesInvoiceWhereInput = withBranchScope(scope, {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { invoiceNumber: { contains: search } },
              { patientName: { contains: search } },
              { doctorName: { contains: search } },
            ],
          }
        : {}),
    });

    const [total, rows] = await Promise.all([
      this.prisma.client.salesInvoice.count({ where }),
      this.prisma.client.salesInvoice.findMany({
        where,
        orderBy: { invoiceDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toSalesInvoiceResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const scope = getTenantScope(this.requestContext);
    const invoice = await this.prisma.client.salesInvoice.findFirst({
      where: withBranchScope(scope, { id, deletedAt: null }),
    });

    if (!invoice) {
      throwNotFound(
        ErrorCode.SALES_INVOICE_NOT_FOUND,
        `Sales invoice not found: ${id}`,
        { id: id.toString() },
      );
    }

    return toSalesInvoiceResponse(invoice);
  }

  async create(dto: CreateSalesInvoiceDto) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      await assertBranchExists(tx, dto.branchId);

      if (dto.branchId !== scope.branchId) {
        throw new ApplicationException(
          ErrorCode.FORBIDDEN,
          'Sales invoice branch must match request context branch',
          HttpStatus.FORBIDDEN,
          { branchId: dto.branchId.toString() },
        );
      }

      if (dto.customerId) {
        await assertCustomerActive(tx, dto.customerId);
      }

      if (dto.prescriptionId) {
        await assertPrescriptionExists(tx, dto.prescriptionId, dto.branchId);
      }

      const invoiceUuid = randomUUID();
      const now = BigInt(Date.now());
      const invoice = await tx.salesInvoice.create({
        data: {
          uuid: invoiceUuid,
          invoiceNumber: `DRAFT-${invoiceUuid.slice(0, 8)}`,
          customerId: dto.customerId,
          prescriptionId: dto.prescriptionId,
          branchId: dto.branchId,
          invoiceDate: dto.invoiceDate,
          patientName: dto.patientName,
          doctorName: dto.doctorName,
          grossAmount: 0,
          discountAmount: 0,
          taxAmount: 0,
          roundOffAmount: 0,
          netAmount: 0,
          paidAmount: 0,
          balanceAmount: 0,
          paymentStatus: SalesInvoicePaymentStatus.UNPAID,
          status: SalesInvoiceStatus.DRAFT,
          salesType: dto.salesType ?? 'RETAIL_OTC',
          remarks: dto.remarks,
          createdBy: this.requestContext.tryGet()?.userId,
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
      return toSalesInvoiceResponse(invoice);
    });
  }

  async update(id: bigint, dto: UpdateSalesInvoiceDto) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const existing = await tx.salesInvoice.findFirst({
        where: withBranchScope(scope, { id, deletedAt: null }),
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.SALES_INVOICE_NOT_FOUND,
          `Sales invoice not found: ${id}`,
          { id: id.toString() },
        );
      }

      assertDraftStatus(existing.status, 'Sales invoice');

      if (dto.customerId) {
        await assertCustomerActive(tx, dto.customerId);
      }

      if (dto.prescriptionId) {
        await assertPrescriptionExists(
          tx,
          dto.prescriptionId,
          existing.branchId,
        );
      }

      const updateResult = await tx.salesInvoice.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          customerId: dto.customerId,
          prescriptionId: dto.prescriptionId,
          invoiceDate: dto.invoiceDate,
          patientName: dto.patientName,
          doctorName: dto.doctorName,
          salesType: dto.salesType,
          paymentMode: dto.paymentMode,
          remarks: dto.remarks,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Sales invoice version conflict or not found: ${id}`,
      );

      const invoice = await tx.salesInvoice.findFirstOrThrow({ where: { id } });
      await this.emitChange(
        tx,
        invoice,
        AuditAction.UPDATE,
        OutboxOperation.UPDATE,
      );
      return toSalesInvoiceResponse(invoice);
    });
  }

  async delete(id: bigint, version: number) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const existing = await tx.salesInvoice.findFirst({
        where: withBranchScope(scope, { id, deletedAt: null }),
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.SALES_INVOICE_NOT_FOUND,
          `Sales invoice not found: ${id}`,
          { id: id.toString() },
        );
      }

      assertDraftStatus(existing.status, 'Sales invoice');

      const updateResult = await tx.salesInvoice.updateMany({
        where: { id, version, deletedAt: null },
        data: {
          deletedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Sales invoice version conflict or not found: ${id}`,
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

  async post(id: bigint, dto: SalesWorkflowDto) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const invoice = await tx.salesInvoice.findFirst({
        where: withBranchScope(scope, { id, deletedAt: null }),
        include: { items: { where: { deletedAt: null } } },
      });

      if (!invoice) {
        throwNotFound(
          ErrorCode.SALES_INVOICE_NOT_FOUND,
          `Sales invoice not found: ${id}`,
          { id: id.toString() },
        );
      }

      if (invoice.status !== SalesInvoiceStatus.DRAFT) {
        throw new ApplicationException(
          ErrorCode.INVALID_DOCUMENT_STATUS,
          'Only draft sales invoices can be posted',
          HttpStatus.CONFLICT,
          { status: invoice.status },
        );
      }

      if (invoice.items.length === 0) {
        throw new ApplicationException(
          ErrorCode.DOCUMENT_HAS_NO_ITEMS,
          'Sales invoice must have at least one item',
          HttpStatus.BAD_REQUEST,
          { id: id.toString() },
        );
      }

      if (
        invoice.paymentMode === SalesPaymentMode.CREDIT &&
        !invoice.customerId
      ) {
        throw new ApplicationException(
          ErrorCode.CUSTOMER_REQUIRED_FOR_CREDIT,
          'Customer is required for credit sales',
          HttpStatus.BAD_REQUEST,
          { id: id.toString() },
        );
      }

      const branch = await assertBranchExists(tx, invoice.branchId);
      const salesSettings = await readSalesSettings(this.settingsService);
      const userId = this.requestContext.tryGet()?.userId;
      const usedBatchIdsByMedicine = new Map<string, Set<string>>();

      await this.reallocateItemsForPost(
        tx,
        invoice,
        branch.id,
        salesSettings.allowExpiredSale,
        usedBatchIdsByMedicine,
      );

      const refreshedItems = await tx.salesInvoiceItem.findMany({
        where: { salesInvoiceId: id, deletedAt: null },
        orderBy: { lineNumber: 'asc' },
      });

      let grossAmount = new Prisma.Decimal(0);
      let discountAmount = new Prisma.Decimal(0);
      let taxAmount = new Prisma.Decimal(0);

      for (const item of refreshedItems) {
        const pricing = await resolvePriceListItem(
          tx,
          branch.id,
          item.medicineId,
          invoice.invoiceDate,
        );

        let unitPrice = pricing.sellingPrice;
        const batchMrp = new Prisma.Decimal(item.mrp);
        if (salesSettings.enforceMrpCap && unitPrice.gt(batchMrp)) {
          unitPrice = batchMrp;
        }

        const lineAmounts = computeLineAmounts(
          item.soldQuantity,
          unitPrice,
          pricing.discountPercent,
          item.discountAmount,
          pricing.taxPercent,
          item.taxAmount,
        );

        await tx.salesInvoiceItem.update({
          where: { id: item.id },
          data: {
            mrp: pricing.mrp,
            unitPrice,
            purchaseRate: item.purchaseRate,
            discountPercent: pricing.discountPercent,
            discountAmount: lineAmounts.discountAmount,
            taxPercent: pricing.taxPercent,
            taxAmount: lineAmounts.taxAmount,
            taxId: pricing.taxId,
            lineAmount: lineAmounts.lineAmount,
            updatedAt: BigInt(Date.now()),
          },
        });

        const lineGross = new Prisma.Decimal(item.soldQuantity).mul(unitPrice);
        grossAmount = grossAmount.add(lineGross);
        discountAmount = discountAmount.add(lineAmounts.discountAmount);
        taxAmount = taxAmount.add(lineAmounts.taxAmount);

        await this.inventoryLedger.applyMovement(tx, {
          branchId: invoice.branchId,
          branchCode: branch.branchCode,
          companyId: branch.companyId,
          medicineId: item.medicineId,
          batchId: item.batchId,
          direction: 'OUT',
          quantity: item.soldQuantity,
          unitCost: item.purchaseRate ?? unitPrice,
          movementType: StockMovementType.SALES_INVOICE,
          referenceTable: 'sales_invoices',
          referenceId: invoice.id,
          createdBy: userId,
          remarks: dto.remarks,
        });
      }

      const netAmount = grossAmount.sub(discountAmount).add(taxAmount);

      await assertTransactionDateInOpenYear(
        tx,
        branch.companyId,
        invoice.invoiceDate,
      );

      const { documentNumber } = await this.sequences.next(tx, {
        companyId: branch.companyId,
        branchId: branch.id,
        documentType: DocumentType.SALES_INVOICE,
        branchCode: branch.branchCode,
      });

      const ledgerLines = await buildSalesInvoiceLedgerLines(tx, {
        netAmount,
        taxAmount,
        customerId: invoice.customerId,
        narration: `Sales invoice ${documentNumber}`,
      });

      await this.ledgerPosting.postVoucher(tx, {
        companyId: branch.companyId,
        voucherType: VoucherType.SALES,
        voucherId: invoice.id,
        voucherNumber: documentNumber,
        transactionDate: invoice.invoiceDate,
        lines: ledgerLines,
        createdBy: userId,
      });

      if (invoice.customerId) {
        await adjustCustomerOutstanding(tx, invoice.customerId, netAmount);
      }

      const updateResult = await tx.salesInvoice.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          invoiceNumber: documentNumber,
          status: SalesInvoiceStatus.POSTED,
          grossAmount,
          discountAmount,
          taxAmount,
          netAmount,
          balanceAmount: netAmount,
          paymentStatus: SalesInvoicePaymentStatus.UNPAID,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Sales invoice version conflict or not found: ${id}`,
      );

      const updated = await tx.salesInvoice.findFirstOrThrow({ where: { id } });
      await this.emitChange(
        tx,
        updated,
        AuditAction.POST,
        OutboxOperation.UPDATE,
      );
      return toSalesInvoiceResponse(updated);
    });
  }

  async cancel(id: bigint, dto: SalesWorkflowDto) {
    return this.unitOfWork.run(async (tx) => {
      const scope = getTenantScope(this.requestContext);
      const invoice = await tx.salesInvoice.findFirst({
        where: withBranchScope(scope, { id, deletedAt: null }),
        include: { items: { where: { deletedAt: null } } },
      });

      if (!invoice) {
        throwNotFound(
          ErrorCode.SALES_INVOICE_NOT_FOUND,
          `Sales invoice not found: ${id}`,
          { id: id.toString() },
        );
      }

      if (
        !(SALES_INVOICE_CANCELLABLE_STATUSES as readonly string[]).includes(
          invoice.status,
        )
      ) {
        throw new ApplicationException(
          ErrorCode.INVALID_DOCUMENT_STATUS,
          `Sales invoice cannot be cancelled from status ${invoice.status}`,
          HttpStatus.CONFLICT,
          { status: invoice.status },
        );
      }

      if (
        invoice.status === SalesInvoiceStatus.POSTED ||
        invoice.status === SalesInvoiceStatus.PARTIALLY_RETURNED
      ) {
        await this.reversePostedSalesInvoiceEffects(tx, invoice, dto.remarks);
      }

      const updateResult = await tx.salesInvoice.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          status: SalesInvoiceStatus.CANCELLED,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Sales invoice version conflict or not found: ${id}`,
      );

      const updated = await tx.salesInvoice.findFirstOrThrow({ where: { id } });
      await this.emitChange(
        tx,
        updated,
        AuditAction.UPDATE,
        OutboxOperation.UPDATE,
      );
      return toSalesInvoiceResponse(updated);
    });
  }

  private async reversePostedSalesInvoiceEffects(
    tx: Prisma.TransactionClient,
    invoice: {
      id: bigint;
      branchId: bigint;
      invoiceNumber: string;
      customerId: bigint | null;
      balanceAmount: Prisma.Decimal;
      items: Array<{
        id: bigint;
        medicineId: bigint;
        batchId: bigint;
        soldQuantity: Prisma.Decimal;
        purchaseRate: Prisma.Decimal | null;
        unitPrice: Prisma.Decimal;
      }>;
    },
    remarks?: string,
  ): Promise<void> {
    const branch = await assertBranchExists(tx, invoice.branchId);
    const userId = this.requestContext.tryGet()?.userId;
    const netSoldByItem = await computeNetSoldQuantitiesByItem(tx, invoice.id);

    await this.ledgerPosting.reverseVoucher(tx, {
      companyId: branch.companyId,
      originalVoucherType: VoucherType.SALES,
      originalVoucherId: invoice.id,
      originalVoucherNumber: invoice.invoiceNumber,
      reversalVoucherType: VoucherType.SALES,
      reversalVoucherId: invoice.id,
      reversalVoucherNumber: `${invoice.invoiceNumber}-REV`,
      transactionDate: BigInt(Date.now()),
      createdBy: userId,
      narration: remarks,
    });

    const completedReturns = await tx.salesReturn.findMany({
      where: {
        salesInvoiceId: invoice.id,
        status: SalesReturnStatus.COMPLETED,
        deletedAt: null,
      },
      select: { id: true, salesReturnNumber: true },
    });

    for (const salesReturn of completedReturns) {
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
        narration: remarks,
      });
    }

    for (const item of invoice.items) {
      const netSold =
        netSoldByItem.get(item.id.toString()) ?? new Prisma.Decimal(0);
      if (netSold.lte(0)) {
        continue;
      }

      await this.inventoryLedger.applyMovement(tx, {
        branchId: invoice.branchId,
        branchCode: branch.branchCode,
        companyId: branch.companyId,
        medicineId: item.medicineId,
        batchId: item.batchId,
        direction: 'IN',
        quantity: netSold,
        unitCost: item.purchaseRate ?? item.unitPrice,
        movementType: StockMovementType.SALES_INVOICE,
        referenceTable: 'sales_invoices',
        referenceId: invoice.id,
        createdBy: userId,
        remarks: remarks ?? 'Sales invoice cancellation reversal',
      });
    }

    if (invoice.customerId) {
      await adjustCustomerOutstanding(
        tx,
        invoice.customerId,
        new Prisma.Decimal(invoice.balanceAmount).neg(),
      );
    }
  }

  private async reallocateItemsForPost(
    tx: Prisma.TransactionClient,
    invoice: { id: bigint; branchId: bigint; invoiceDate: bigint },
    branchId: bigint,
    allowExpired: boolean,
    usedBatchIdsByMedicine: Map<string, Set<string>>,
  ): Promise<void> {
    const items = await tx.salesInvoiceItem.findMany({
      where: { salesInvoiceId: invoice.id, deletedAt: null },
      orderBy: { lineNumber: 'asc' },
    });

    for (const item of items) {
      const medicineKey = item.medicineId.toString();
      const usedForMedicine =
        usedBatchIdsByMedicine.get(medicineKey) ?? new Set<string>();

      const allocations = await allocateFefoBatches(
        tx,
        branchId,
        item.medicineId,
        new Prisma.Decimal(item.soldQuantity),
        { allowExpired, asOfDate: invoice.invoiceDate },
      );

      const filtered = allocations.filter(
        (row) => !usedForMedicine.has(row.batchId.toString()),
      );

      if (filtered.length === 0 && allocations.length > 0) {
        throw new ApplicationException(
          ErrorCode.CONFLICT,
          'Duplicate batch allocation on sales invoice',
          HttpStatus.CONFLICT,
          { medicineId: item.medicineId.toString() },
        );
      }

      const [primary, ...extras] = filtered.length > 0 ? filtered : allocations;

      await tx.salesInvoiceItem.update({
        where: { id: item.id },
        data: {
          batchId: primary.batchId,
          soldQuantity: primary.quantity,
          mrp: primary.mrp,
          purchaseRate: primary.purchaseRate,
          updatedAt: BigInt(Date.now()),
        },
      });
      usedForMedicine.add(primary.batchId.toString());
      usedBatchIdsByMedicine.set(medicineKey, usedForMedicine);

      for (const extra of extras) {
        if (usedForMedicine.has(extra.batchId.toString())) {
          continue;
        }

        const now = BigInt(Date.now());
        await tx.salesInvoiceItem.create({
          data: {
            uuid: randomUUID(),
            salesInvoiceId: invoice.id,
            medicineId: item.medicineId,
            batchId: extra.batchId,
            unitId: item.unitId,
            lineNumber: await getNextLineNumber(
              tx,
              'salesInvoiceItem',
              'salesInvoiceId',
              invoice.id,
            ),
            soldQuantity: extra.quantity,
            mrp: extra.mrp,
            unitPrice: 0,
            purchaseRate: extra.purchaseRate,
            conversionFactor: item.conversionFactor,
            discountAmount: 0,
            taxAmount: 0,
            lineAmount: 0,
            remarks: item.remarks,
            createdAt: now,
            updatedAt: now,
          },
        });
        usedForMedicine.add(extra.batchId.toString());
        usedBatchIdsByMedicine.set(medicineKey, usedForMedicine);
      }
    }
  }

  private async emitChange(
    tx: Prisma.TransactionClient,
    invoice: { id: bigint; uuid: string; status?: string },
    action: (typeof AuditAction)[keyof typeof AuditAction],
    operation: (typeof OutboxOperation)[keyof typeof OutboxOperation],
  ) {
    await this.auditService.log(tx, {
      entityType: OutboxEntityType.SALES_INVOICE,
      entityId: invoice.id,
      entityUuid: invoice.uuid,
      action,
      module: AuditModule.SALES,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.SALES_INVOICE,
      entityUuid: invoice.uuid,
      operation,
      payload: { uuid: invoice.uuid, status: invoice.status },
    });
  }
}
