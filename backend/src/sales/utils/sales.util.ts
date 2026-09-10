import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import {
  FinanceReferenceType,
  ReceiptStatus,
  SystemLedgerCode,
} from '../../finance/constants/finance.constants';
import {
  resolveSystemLedger,
  type JournalLineInput,
} from '../../finance/utils/finance.util';
import type { TxClient } from '../../persistence/prisma/prisma-tx.type';
import { SettingKey } from '../../settings/setting-keys.constants';
import { SettingsService } from '../../settings/settings.service';
import {
  SalesInvoiceStatus,
  SalesReturnDisposition,
  SalesReturnStatus,
} from '../constants/sales.constants';

export function serializeBigInt(
  value: bigint | null | undefined,
): string | null {
  return value != null ? value.toString() : null;
}

export function serializeDecimal(
  value: Prisma.Decimal | null | undefined,
): number | null {
  return value != null ? value.toNumber() : null;
}

export function optimisticUpdate<T extends { count: number }>(
  result: T,
  id: bigint,
  message = 'Entity version conflict or not found',
): void {
  if (result.count === 0) {
    throw new ApplicationException(
      ErrorCode.ENTITY_VERSION_CONFLICT,
      message,
      HttpStatus.CONFLICT,
      { id: id.toString() },
    );
  }
}

export function throwNotFound(
  code: string,
  message: string,
  details?: Record<string, string>,
): never {
  throw new ApplicationException(code, message, HttpStatus.NOT_FOUND, details);
}

export function throwConflict(
  message: string,
  details?: Record<string, string>,
  code: string = ErrorCode.CONFLICT,
): never {
  throw new ApplicationException(code, message, HttpStatus.CONFLICT, details);
}

export function assertDraftStatus(
  status: string,
  entityLabel: string,
  draftStatus = SalesInvoiceStatus.DRAFT,
): void {
  if (status !== draftStatus) {
    throw new ApplicationException(
      ErrorCode.INVALID_DOCUMENT_STATUS,
      `${entityLabel} can only be modified while in ${draftStatus} status`,
      HttpStatus.CONFLICT,
      { status },
    );
  }
}

export async function assertCustomerActive(
  tx: TxClient,
  customerId: bigint,
): Promise<{ id: bigint }> {
  const customer = await tx.customer.findFirst({
    where: { id: customerId, deletedAt: null, isActive: true },
    select: { id: true },
  });

  if (!customer) {
    throw new ApplicationException(
      ErrorCode.CUSTOMER_NOT_FOUND,
      `Customer not found or inactive: ${customerId}`,
      HttpStatus.CONFLICT,
      { customerId: customerId.toString() },
    );
  }

  return customer;
}

export async function assertPrescriptionExists(
  tx: TxClient,
  prescriptionId: bigint,
  branchId: bigint,
): Promise<{ id: bigint }> {
  const prescription = await tx.prescription.findFirst({
    where: { id: prescriptionId, branchId, deletedAt: null },
    select: { id: true },
  });

  if (!prescription) {
    throw new ApplicationException(
      ErrorCode.PRESCRIPTION_NOT_FOUND,
      `Prescription not found: ${prescriptionId}`,
      HttpStatus.NOT_FOUND,
      { prescriptionId: prescriptionId.toString() },
    );
  }

  return prescription;
}

export async function assertMedicineExists(
  tx: TxClient,
  medicineId: bigint,
): Promise<{ id: bigint }> {
  const medicine = await tx.medicine.findFirst({
    where: { id: medicineId, deletedAt: null },
    select: { id: true },
  });

  if (!medicine) {
    throw new ApplicationException(
      ErrorCode.MEDICINE_NOT_FOUND,
      `Medicine not found: ${medicineId}`,
      HttpStatus.NOT_FOUND,
      { medicineId: medicineId.toString() },
    );
  }

  return medicine;
}

export function computeLineAmounts(
  quantity: Prisma.Decimal | number | string,
  unitPrice: Prisma.Decimal | number | string,
  discountPercent?: Prisma.Decimal | number | string | null,
  discountAmount?: Prisma.Decimal | number | string | null,
  taxPercent?: Prisma.Decimal | number | string | null,
  taxAmount?: Prisma.Decimal | number | string | null,
): {
  discountAmount: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  lineAmount: Prisma.Decimal;
} {
  const qty = new Prisma.Decimal(quantity);
  const price = new Prisma.Decimal(unitPrice);
  const gross = qty.mul(price);

  let discount =
    discountAmount != null
      ? new Prisma.Decimal(discountAmount)
      : new Prisma.Decimal(0);
  if (discountPercent != null && discount.eq(0)) {
    discount = gross.mul(new Prisma.Decimal(discountPercent)).div(100);
  }

  const taxable = gross.sub(discount);
  let tax =
    taxAmount != null ? new Prisma.Decimal(taxAmount) : new Prisma.Decimal(0);
  if (taxPercent != null && tax.eq(0)) {
    tax = taxable.mul(new Prisma.Decimal(taxPercent)).div(100);
  }

  return {
    discountAmount: discount,
    taxAmount: tax,
    lineAmount: taxable.add(tax),
  };
}

export async function getNextLineNumber(
  tx: TxClient,
  model: 'salesInvoiceItem' | 'salesReturnItem',
  parentField: string,
  parentId: bigint,
): Promise<number> {
  const where = { [parentField]: parentId, deletedAt: null };

  if (model === 'salesInvoiceItem') {
    const aggregate = await tx.salesInvoiceItem.aggregate({
      where,
      _max: { lineNumber: true },
    });
    return (aggregate._max.lineNumber ?? 0) + 1;
  }

  const aggregate = await tx.salesReturnItem.aggregate({
    where,
    _max: { lineNumber: true },
  });
  return (aggregate._max.lineNumber ?? 0) + 1;
}

export interface FefoAllocation {
  batchId: bigint;
  quantity: Prisma.Decimal;
  purchaseRate: Prisma.Decimal;
  mrp: Prisma.Decimal;
  expiryDate: bigint;
}

export async function allocateFefoBatches(
  tx: TxClient,
  branchId: bigint,
  medicineId: bigint,
  quantity: Prisma.Decimal,
  options: { allowExpired: boolean; asOfDate: bigint },
): Promise<FefoAllocation[]> {
  const stocks = await tx.stock.findMany({
    where: {
      branchId,
      deletedAt: null,
      availableQuantity: { gt: 0 },
      batch: { medicineId, deletedAt: null, isActive: true },
    },
    include: {
      batch: {
        select: {
          id: true,
          expiryDate: true,
          purchaseRate: true,
          mrp: true,
        },
      },
    },
  });

  const candidates = stocks
    .map((stock) => ({
      batchId: stock.batchId,
      expiryDate: stock.batch.expiryDate,
      purchaseRate: new Prisma.Decimal(stock.batch.purchaseRate),
      mrp: new Prisma.Decimal(stock.batch.mrp),
      available: new Prisma.Decimal(stock.availableQuantity).sub(
        stock.reservedQuantity,
      ),
    }))
    .filter((row) => {
      if (row.available.lte(0)) {
        return false;
      }
      if (!options.allowExpired && row.expiryDate < options.asOfDate) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (a.expiryDate < b.expiryDate) return -1;
      if (a.expiryDate > b.expiryDate) return 1;
      return 0;
    });

  let remaining = new Prisma.Decimal(quantity);
  const allocations: FefoAllocation[] = [];

  for (const candidate of candidates) {
    if (remaining.lte(0)) {
      break;
    }

    const take = candidate.available.lte(remaining)
      ? candidate.available
      : remaining;
    if (take.lte(0)) {
      continue;
    }

    allocations.push({
      batchId: candidate.batchId,
      quantity: take,
      purchaseRate: candidate.purchaseRate,
      mrp: candidate.mrp,
      expiryDate: candidate.expiryDate,
    });
    remaining = remaining.sub(take);
  }

  if (remaining.gt(0)) {
    throw new ApplicationException(
      ErrorCode.STOCK_INSUFFICIENT,
      'Insufficient stock for FEFO allocation',
      HttpStatus.CONFLICT,
      {
        medicineId: medicineId.toString(),
        requested: quantity.toString(),
        shortfall: remaining.toString(),
      },
    );
  }

  return allocations;
}

export interface ResolvedPrice {
  sellingPrice: Prisma.Decimal;
  mrp: Prisma.Decimal;
  taxId: bigint | null;
  taxPercent: Prisma.Decimal | null;
  discountPercent: Prisma.Decimal | null;
}

export async function resolvePriceListItem(
  tx: TxClient,
  branchId: bigint,
  medicineId: bigint,
  asOfDate: bigint,
): Promise<ResolvedPrice> {
  const priceList = await tx.priceList.findFirst({
    where: {
      deletedAt: null,
      isActive: true,
      effectiveFrom: { lte: asOfDate },
      AND: [
        {
          OR: [{ branchId }, { branchId: null, isDefault: true }],
        },
        {
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: asOfDate } }],
        },
      ],
    },
    orderBy: [{ branchId: 'desc' }, { isDefault: 'desc' }],
  });

  if (!priceList) {
    throw new ApplicationException(
      ErrorCode.PRICE_LIST_NOT_FOUND,
      'No active price list found for branch',
      HttpStatus.NOT_FOUND,
      { branchId: branchId.toString() },
    );
  }

  const item = await tx.priceListItem.findFirst({
    where: {
      priceListId: priceList.id,
      medicineId,
      deletedAt: null,
      isActive: true,
      effectiveFrom: { lte: asOfDate },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: asOfDate } }],
    },
    include: { tax: { select: { taxRate: true } } },
  });

  if (!item) {
    throw new ApplicationException(
      ErrorCode.PRICE_LIST_ITEM_NOT_FOUND,
      `No price list item for medicine: ${medicineId}`,
      HttpStatus.NOT_FOUND,
      { medicineId: medicineId.toString() },
    );
  }

  return {
    sellingPrice: new Prisma.Decimal(item.sellingPrice),
    mrp: new Prisma.Decimal(item.mrp),
    taxId: item.taxId,
    taxPercent: item.tax?.taxRate ? new Prisma.Decimal(item.tax.taxRate) : null,
    discountPercent: item.discountPercent
      ? new Prisma.Decimal(item.discountPercent)
      : null,
  };
}

export function assertBatchNotExpired(
  expiryDate: bigint,
  asOfDate: bigint,
  allowExpired: boolean,
  batchId: bigint,
): void {
  if (!allowExpired && expiryDate < asOfDate) {
    throw new ApplicationException(
      ErrorCode.BATCH_EXPIRED,
      `Batch is expired: ${batchId}`,
      HttpStatus.CONFLICT,
      { batchId: batchId.toString() },
    );
  }
}

export async function rollupSalesInvoiceTotals(
  tx: TxClient,
  salesInvoiceId: bigint,
): Promise<void> {
  const invoice = await tx.salesInvoice.findFirst({
    where: { id: salesInvoiceId, deletedAt: null },
    select: { roundOffAmount: true },
  });

  if (!invoice) {
    throwNotFound(
      ErrorCode.SALES_INVOICE_NOT_FOUND,
      `Sales invoice not found: ${salesInvoiceId}`,
      { id: salesInvoiceId.toString() },
    );
  }

  const items = await tx.salesInvoiceItem.findMany({
    where: { salesInvoiceId, deletedAt: null },
  });

  let grossAmount = new Prisma.Decimal(0);
  let discountAmount = new Prisma.Decimal(0);
  let taxAmount = new Prisma.Decimal(0);

  for (const item of items) {
    const lineGross = new Prisma.Decimal(item.soldQuantity).mul(item.unitPrice);
    grossAmount = grossAmount.add(lineGross);
    discountAmount = discountAmount.add(item.discountAmount);
    taxAmount = taxAmount.add(item.taxAmount);
  }

  const netAmount = grossAmount
    .sub(discountAmount)
    .add(taxAmount)
    .add(invoice.roundOffAmount);

  await tx.salesInvoice.update({
    where: { id: salesInvoiceId },
    data: {
      grossAmount,
      discountAmount,
      taxAmount,
      netAmount,
      balanceAmount: netAmount,
      updatedAt: BigInt(Date.now()),
    },
  });
}

export async function computeNetSoldQuantitiesByItem(
  tx: TxClient,
  invoiceId: bigint,
): Promise<Map<string, Prisma.Decimal>> {
  const items = await tx.salesInvoiceItem.findMany({
    where: { salesInvoiceId: invoiceId, deletedAt: null },
    select: { id: true, soldQuantity: true },
  });

  const returnItems = await tx.salesReturnItem.findMany({
    where: {
      deletedAt: null,
      salesReturn: {
        salesInvoiceId: invoiceId,
        status: SalesReturnStatus.COMPLETED,
        deletedAt: null,
      },
    },
    select: { salesInvoiceItemId: true, returnQuantity: true },
  });

  const returnedByItem = new Map<string, Prisma.Decimal>();
  for (const row of returnItems) {
    const key = row.salesInvoiceItemId.toString();
    const current = returnedByItem.get(key) ?? new Prisma.Decimal(0);
    returnedByItem.set(key, current.add(row.returnQuantity));
  }

  const result = new Map<string, Prisma.Decimal>();
  for (const item of items) {
    const returned =
      returnedByItem.get(item.id.toString()) ?? new Prisma.Decimal(0);
    result.set(
      item.id.toString(),
      new Prisma.Decimal(item.soldQuantity).sub(returned),
    );
  }

  return result;
}

export async function assertReturnQuantityWithinSold(
  tx: TxClient,
  salesInvoiceItemId: bigint,
  returnQuantity: Prisma.Decimal,
  excludeReturnId?: bigint,
): Promise<void> {
  const invoiceItem = await tx.salesInvoiceItem.findFirst({
    where: { id: salesInvoiceItemId, deletedAt: null },
    select: { soldQuantity: true },
  });

  if (!invoiceItem) {
    throwNotFound(
      ErrorCode.SALES_INVOICE_ITEM_NOT_FOUND,
      `Sales invoice item not found: ${salesInvoiceItemId}`,
      { id: salesInvoiceItemId.toString() },
    );
  }

  const priorReturns = await tx.salesReturnItem.aggregate({
    where: {
      salesInvoiceItemId,
      deletedAt: null,
      salesReturn: {
        status: { in: [SalesReturnStatus.COMPLETED, SalesReturnStatus.DRAFT] },
        deletedAt: null,
        ...(excludeReturnId != null ? { id: { not: excludeReturnId } } : {}),
      },
    },
    _sum: { returnQuantity: true },
  });

  const alreadyReturned = new Prisma.Decimal(
    priorReturns._sum.returnQuantity ?? 0,
  );
  const soldQty = new Prisma.Decimal(invoiceItem.soldQuantity);
  const remaining = soldQty.sub(alreadyReturned);

  if (returnQuantity.gt(remaining)) {
    throw new ApplicationException(
      ErrorCode.RETURN_QUANTITY_EXCEEDED,
      'Return quantity exceeds sold quantity remaining',
      HttpStatus.CONFLICT,
      {
        salesInvoiceItemId: salesInvoiceItemId.toString(),
        requested: returnQuantity.toString(),
        remaining: remaining.toString(),
      },
    );
  }
}

export async function assertReturnItemMatchesInvoiceLine(
  tx: TxClient,
  salesInvoiceItemId: bigint,
  medicineId: bigint,
  batchId: bigint,
): Promise<void> {
  const invoiceItem = await tx.salesInvoiceItem.findFirst({
    where: { id: salesInvoiceItemId, deletedAt: null },
    select: { medicineId: true, batchId: true },
  });

  if (!invoiceItem) {
    throwNotFound(
      ErrorCode.SALES_INVOICE_ITEM_NOT_FOUND,
      `Sales invoice item not found: ${salesInvoiceItemId}`,
      { id: salesInvoiceItemId.toString() },
    );
  }

  if (
    invoiceItem.medicineId !== medicineId ||
    invoiceItem.batchId !== batchId
  ) {
    throw new ApplicationException(
      ErrorCode.BAD_REQUEST,
      'Return item medicine and batch must match the sales invoice line',
      HttpStatus.BAD_REQUEST,
      {
        salesInvoiceItemId: salesInvoiceItemId.toString(),
        medicineId: medicineId.toString(),
        batchId: batchId.toString(),
      },
    );
  }
}

export function assertRestockDisposition(disposition: string): void {
  if (disposition !== SalesReturnDisposition.RESTOCK) {
    throw new ApplicationException(
      ErrorCode.BAD_REQUEST,
      'Only RESTOCK disposition is supported',
      HttpStatus.BAD_REQUEST,
      { disposition },
    );
  }
}

export async function readSalesSettings(settingsService: SettingsService) {
  const [enforceMrpCap, allowExpiredSale, allowExpiredCustomerReturn] =
    await Promise.all([
      settingsService.getBoolean(SettingKey.SALES_ENFORCE_MRP_CAP, true),
      settingsService.getBoolean(SettingKey.SALES_ALLOW_EXPIRED_SALE, false),
      settingsService.getBoolean(
        SettingKey.SALES_ALLOW_EXPIRED_CUSTOMER_RETURN,
        false,
      ),
    ]);

  return {
    enforceMrpCap,
    allowExpiredSale,
    allowExpiredCustomerReturn,
  };
}

export function assertInvoicePosted(status: string): void {
  if (
    status !== SalesInvoiceStatus.POSTED &&
    status !== SalesInvoiceStatus.PARTIALLY_RETURNED
  ) {
    throw new ApplicationException(
      ErrorCode.INVOICE_NOT_POSTED,
      'Sales invoice must be posted',
      HttpStatus.CONFLICT,
      { status },
    );
  }
}

const SALES_CASH_METHODS = [
  'CASH',
  'UPI',
  'CARD',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'STORE_CREDIT',
] as const;

const SALES_BANK_METHODS = ['CHEQUE', 'BANK_TRANSFER', 'NET_BANKING'] as const;

async function resolveSalesCashOrBankLedger(
  tx: TxClient,
  paymentMethod: string,
): Promise<bigint> {
  const isBank = (SALES_BANK_METHODS as readonly string[]).includes(
    paymentMethod,
  );
  const isCash = (SALES_CASH_METHODS as readonly string[]).includes(
    paymentMethod,
  );

  if (!isBank && !isCash) {
    throw new ApplicationException(
      ErrorCode.BAD_REQUEST,
      `Unsupported sales payment method: ${paymentMethod}`,
      HttpStatus.BAD_REQUEST,
      { paymentMethod },
    );
  }

  const ledgerCode = isBank ? SystemLedgerCode.BANK : SystemLedgerCode.CASH;
  const ledger = await resolveSystemLedger(tx, ledgerCode);
  return ledger.id;
}

export function computeSalesInvoicePaymentStatus(
  netAmount: Prisma.Decimal,
  paidAmount: Prisma.Decimal,
): string {
  if (paidAmount.lte(0)) {
    return 'UNPAID';
  }
  if (netAmount.gt(0) && paidAmount.gt(netAmount)) {
    return 'REFUNDED';
  }
  if (paidAmount.gte(netAmount)) {
    return 'PAID';
  }
  return 'PARTIALLY_PAID';
}

export async function computeSalesInvoiceEffectiveNet(
  tx: TxClient,
  invoiceId: bigint,
): Promise<Prisma.Decimal> {
  const invoice = await tx.salesInvoice.findFirst({
    where: { id: invoiceId, deletedAt: null },
    select: { netAmount: true },
  });

  if (!invoice) {
    throwNotFound(
      ErrorCode.SALES_INVOICE_NOT_FOUND,
      `Sales invoice not found: ${invoiceId}`,
      { id: invoiceId.toString() },
    );
  }

  const returns = await tx.salesReturn.findMany({
    where: {
      salesInvoiceId: invoiceId,
      status: 'COMPLETED',
      deletedAt: null,
    },
    select: { netAmount: true },
  });

  let returnTotal = new Prisma.Decimal(0);
  for (const row of returns) {
    returnTotal = returnTotal.add(row.netAmount);
  }

  return new Prisma.Decimal(invoice.netAmount).sub(returnTotal);
}

export async function assertSalesInvoiceReceiptAmount(
  tx: TxClient,
  invoiceId: bigint,
  receiptAmount: Prisma.Decimal,
): Promise<{ customerId: bigint | null }> {
  const invoice = await tx.salesInvoice.findFirst({
    where: { id: invoiceId, deletedAt: null },
  });

  if (!invoice) {
    throwNotFound(
      ErrorCode.SALES_INVOICE_NOT_FOUND,
      `Sales invoice not found: ${invoiceId}`,
      { id: invoiceId.toString() },
    );
  }

  if (receiptAmount.gt(invoice.balanceAmount)) {
    throw new ApplicationException(
      ErrorCode.BAD_REQUEST,
      'Receipt amount exceeds sales invoice balance',
      HttpStatus.BAD_REQUEST,
      {
        receiptAmount: receiptAmount.toString(),
        balanceAmount: invoice.balanceAmount.toString(),
      },
    );
  }

  return { customerId: invoice.customerId };
}

export async function buildSalesInvoiceLedgerLines(
  tx: TxClient,
  input: {
    netAmount: Prisma.Decimal;
    taxAmount: Prisma.Decimal;
    customerId?: bigint | null;
    narration?: string;
  },
): Promise<JournalLineInput[]> {
  const netAmount = new Prisma.Decimal(input.netAmount);
  const taxAmount = new Prisma.Decimal(input.taxAmount);
  const salesAmount = netAmount.sub(taxAmount);

  const debitLedger = input.customerId
    ? await resolveSystemLedger(tx, SystemLedgerCode.CUSTOMER_RECEIVABLE)
    : await resolveSystemLedger(tx, SystemLedgerCode.CASH);
  const sales = await resolveSystemLedger(tx, SystemLedgerCode.SALES);
  const gstOutput = await resolveSystemLedger(tx, SystemLedgerCode.GST_OUTPUT);

  const lines: JournalLineInput[] = [
    {
      ledgerId: debitLedger.id,
      debitAmount: netAmount,
      creditAmount: new Prisma.Decimal(0),
      narration: input.narration,
    },
  ];

  if (salesAmount.gt(0)) {
    lines.push({
      ledgerId: sales.id,
      debitAmount: new Prisma.Decimal(0),
      creditAmount: salesAmount,
      narration: input.narration,
    });
  }

  if (taxAmount.gt(0)) {
    lines.push({
      ledgerId: gstOutput.id,
      debitAmount: new Prisma.Decimal(0),
      creditAmount: taxAmount,
      narration: input.narration,
    });
  }

  return lines;
}

export async function buildSalesPaymentLedgerLines(
  tx: TxClient,
  input: {
    amount: Prisma.Decimal;
    paymentMethod: string;
    customerId?: bigint | null;
    narration?: string;
  },
): Promise<JournalLineInput[]> {
  if (!input.customerId) {
    throw new ApplicationException(
      ErrorCode.BAD_REQUEST,
      'Sales payment requires a customer on the invoice',
      HttpStatus.BAD_REQUEST,
    );
  }

  const amount = new Prisma.Decimal(input.amount);
  const cashOrBankLedgerId = await resolveSalesCashOrBankLedger(
    tx,
    input.paymentMethod,
  );
  const receivable = await resolveSystemLedger(
    tx,
    SystemLedgerCode.CUSTOMER_RECEIVABLE,
  );

  return [
    {
      ledgerId: cashOrBankLedgerId,
      debitAmount: amount,
      creditAmount: new Prisma.Decimal(0),
      narration: input.narration,
    },
    {
      ledgerId: receivable.id,
      debitAmount: new Prisma.Decimal(0),
      creditAmount: amount,
      narration: input.narration,
    },
  ];
}

export async function buildSalesReturnLedgerLines(
  tx: TxClient,
  input: {
    netAmount: Prisma.Decimal;
    taxAmount: Prisma.Decimal;
    customerId?: bigint | null;
    narration?: string;
  },
): Promise<JournalLineInput[]> {
  const netAmount = new Prisma.Decimal(input.netAmount);
  const taxAmount = new Prisma.Decimal(input.taxAmount);
  const salesAmount = netAmount.sub(taxAmount);

  const creditLedger = input.customerId
    ? await resolveSystemLedger(tx, SystemLedgerCode.CUSTOMER_RECEIVABLE)
    : await resolveSystemLedger(tx, SystemLedgerCode.CASH);
  const sales = await resolveSystemLedger(tx, SystemLedgerCode.SALES);
  const gstOutput = await resolveSystemLedger(tx, SystemLedgerCode.GST_OUTPUT);

  const lines: JournalLineInput[] = [
    {
      ledgerId: creditLedger.id,
      debitAmount: new Prisma.Decimal(0),
      creditAmount: netAmount,
      narration: input.narration,
    },
  ];

  if (salesAmount.gt(0)) {
    lines.push({
      ledgerId: sales.id,
      debitAmount: salesAmount,
      creditAmount: new Prisma.Decimal(0),
      narration: input.narration,
    });
  }

  if (taxAmount.gt(0)) {
    lines.push({
      ledgerId: gstOutput.id,
      debitAmount: taxAmount,
      creditAmount: new Prisma.Decimal(0),
      narration: input.narration,
    });
  }

  return lines;
}

export async function recomputeSalesInvoiceSettlement(
  tx: TxClient,
  invoiceId: bigint,
): Promise<void> {
  const invoice = await tx.salesInvoice.findFirst({
    where: { id: invoiceId, deletedAt: null },
  });

  if (!invoice) {
    throwNotFound(
      ErrorCode.SALES_INVOICE_NOT_FOUND,
      `Sales invoice not found: ${invoiceId}`,
      { id: invoiceId.toString() },
    );
  }

  const [payments, receipts] = await Promise.all([
    tx.salesPayment.findMany({
      where: {
        salesInvoiceId: invoiceId,
        status: 'COMPLETED',
        deletedAt: null,
      },
      select: { paymentAmount: true },
    }),
    tx.receipt.findMany({
      where: {
        referenceType: FinanceReferenceType.SALES_INVOICE,
        referenceId: invoiceId,
        status: ReceiptStatus.COMPLETED,
        deletedAt: null,
      },
      select: { amount: true },
    }),
  ]);

  let paidAmount = new Prisma.Decimal(0);
  for (const payment of payments) {
    paidAmount = paidAmount.add(payment.paymentAmount);
  }
  for (const receipt of receipts) {
    paidAmount = paidAmount.add(receipt.amount);
  }

  const effectiveNet = await computeSalesInvoiceEffectiveNet(tx, invoiceId);
  const balanceAmount = effectiveNet.sub(paidAmount);

  await tx.salesInvoice.update({
    where: { id: invoiceId },
    data: {
      paidAmount,
      balanceAmount,
      paymentStatus: computeSalesInvoicePaymentStatus(effectiveNet, paidAmount),
      updatedAt: BigInt(Date.now()),
    },
  });
}
