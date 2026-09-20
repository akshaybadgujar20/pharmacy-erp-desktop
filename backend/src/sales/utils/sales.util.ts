import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import type { TxClient } from '../../persistence/prisma/prisma-tx.type';
import { SettingKey } from '../../settings/setting-keys.constants';
import { SettingsService } from '../../settings/settings.service';
import {
  PrescriptionItemStatus,
  PrescriptionStatus,
} from '../../prescription/constants/prescription.constants';
import {
  SalesInvoiceStatus,
  SalesPaymentMethod,
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
  const [
    enforceMrpCap,
    allowExpiredSale,
    allowExpiredCustomerReturn,
    applyRoundOff,
    prescriptionMandatoryScheduleH,
    returnWindowDays,
    returnRequiresPharmacistForScheduleH,
  ] = await Promise.all([
    settingsService.getBoolean(SettingKey.SALES_ENFORCE_MRP_CAP, true),
    settingsService.getBoolean(SettingKey.SALES_ALLOW_EXPIRED_SALE, false),
    settingsService.getBoolean(
      SettingKey.SALES_ALLOW_EXPIRED_CUSTOMER_RETURN,
      false,
    ),
    settingsService.getBoolean(SettingKey.SALES_APPLY_ROUND_OFF, true),
    settingsService.getBoolean(
      SettingKey.PRESCRIPTION_MANDATORY_SCHEDULE_H,
      true,
    ),
    settingsService
      .getString(SettingKey.SALES_RETURN_WINDOW_DAYS, '30')
      .then((value) => {
        const parsed = Number.parseInt(value, 10);
        return Number.isFinite(parsed) ? parsed : 30;
      }),
    settingsService.getBoolean(
      SettingKey.SALES_RETURN_REQUIRES_PHARMACIST_FOR_SCHEDULE_H,
      true,
    ),
  ]);

  return {
    enforceMrpCap,
    allowExpiredSale,
    allowExpiredCustomerReturn,
    applyRoundOff,
    prescriptionMandatoryScheduleH,
    returnWindowDays,
    returnRequiresPharmacistForScheduleH,
  };
}

export function computeSalesRoundOff(subtotal: Prisma.Decimal): {
  roundOffAmount: Prisma.Decimal;
  netAmount: Prisma.Decimal;
} {
  const rounded = subtotal.toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);
  return {
    roundOffAmount: rounded.sub(subtotal),
    netAmount: rounded,
  };
}

function isScheduleHCode(scheduleCode: string): boolean {
  return scheduleCode === 'H' || scheduleCode.startsWith('H');
}

export async function assertScheduleHCompliance(
  tx: TxClient,
  items: Array<{ medicineId: bigint }>,
  prescriptionId: bigint | null | undefined,
  prescriptionMandatoryScheduleH: boolean,
): Promise<void> {
  if (!prescriptionMandatoryScheduleH) {
    return;
  }

  const medicineIds = [...new Set(items.map((item) => item.medicineId))];
  const medicines = await tx.medicine.findMany({
    where: { id: { in: medicineIds }, deletedAt: null },
    include: {
      schedule: { select: { scheduleCode: true, controlledSubstance: true } },
    },
  });

  const requiresPrescription = medicines.some(
    (medicine) =>
      medicine.schedule &&
      (medicine.schedule.controlledSubstance ||
        isScheduleHCode(medicine.schedule.scheduleCode)),
  );

  if (requiresPrescription && !prescriptionId) {
    throw new ApplicationException(
      ErrorCode.SCHEDULE_H_PRESCRIPTION_REQUIRED,
      'Schedule H or controlled medicine requires a linked prescription',
      HttpStatus.CONFLICT,
    );
  }
}

export async function assertPrescriptionQuantitiesForPost(
  tx: TxClient,
  prescriptionId: bigint,
  items: Array<{ medicineId: bigint; soldQuantity: Prisma.Decimal }>,
): Promise<void> {
  const prescriptionItems = await tx.prescriptionItem.findMany({
    where: { prescriptionId, deletedAt: null },
    select: {
      medicineId: true,
      remainingQuantity: true,
    },
  });

  const remainingByMedicine = new Map<string, Prisma.Decimal>();
  for (const item of prescriptionItems) {
    remainingByMedicine.set(
      item.medicineId.toString(),
      new Prisma.Decimal(item.remainingQuantity),
    );
  }

  const soldByMedicine = new Map<string, Prisma.Decimal>();
  for (const item of items) {
    const key = item.medicineId.toString();
    const current = soldByMedicine.get(key) ?? new Prisma.Decimal(0);
    soldByMedicine.set(key, current.add(item.soldQuantity));
  }

  for (const [medicineId, soldQty] of soldByMedicine) {
    const remaining = remainingByMedicine.get(medicineId);
    if (remaining === undefined) {
      throw new ApplicationException(
        ErrorCode.PRESCRIPTION_QUANTITY_EXCEEDED,
        'Medicine is not on the linked prescription',
        HttpStatus.CONFLICT,
        { medicineId },
      );
    }

    if (soldQty.gt(remaining)) {
      throw new ApplicationException(
        ErrorCode.PRESCRIPTION_QUANTITY_EXCEEDED,
        'Sold quantity exceeds prescription remaining quantity',
        HttpStatus.CONFLICT,
        {
          medicineId,
          soldQuantity: soldQty.toString(),
          remaining: remaining.toString(),
        },
      );
    }
  }
}

export async function applyPrescriptionDispensing(
  tx: TxClient,
  prescriptionId: bigint,
  items: Array<{ medicineId: bigint; soldQuantity: Prisma.Decimal }>,
): Promise<void> {
  const prescription = await tx.prescription.findFirstOrThrow({
    where: { id: prescriptionId, deletedAt: null },
    include: {
      items: { where: { deletedAt: null } },
    },
  });

  const soldByMedicine = new Map<string, Prisma.Decimal>();
  for (const item of items) {
    const key = item.medicineId.toString();
    const current = soldByMedicine.get(key) ?? new Prisma.Decimal(0);
    soldByMedicine.set(key, current.add(item.soldQuantity));
  }

  const now = BigInt(Date.now());
  let anyPartial = false;
  let allDispensed = true;

  for (const rxItem of prescription.items) {
    const soldQty =
      soldByMedicine.get(rxItem.medicineId.toString()) ?? new Prisma.Decimal(0);
    if (soldQty.lte(0)) {
      if (new Prisma.Decimal(rxItem.remainingQuantity).gt(0)) {
        allDispensed = false;
      }
      continue;
    }

    const dispensed = new Prisma.Decimal(rxItem.dispensedQuantity).add(soldQty);
    const remaining = new Prisma.Decimal(rxItem.prescribedQuantity).sub(
      dispensed,
    );
    const itemStatus = remaining.lte(0)
      ? PrescriptionItemStatus.DISPENSED
      : PrescriptionItemStatus.PARTIALLY_DISPENSED;

    if (remaining.gt(0)) {
      anyPartial = true;
      allDispensed = false;
    }

    await tx.prescriptionItem.update({
      where: { id: rxItem.id },
      data: {
        dispensedQuantity: dispensed,
        remainingQuantity: remaining.lt(0) ? new Prisma.Decimal(0) : remaining,
        status: itemStatus,
        updatedAt: now,
      },
    });
  }

  const nextStatus = allDispensed
    ? PrescriptionStatus.DISPENSED
    : anyPartial
      ? PrescriptionStatus.PARTIALLY_DISPENSED
      : prescription.status;

  if (nextStatus !== prescription.status) {
    await tx.prescription.update({
      where: { id: prescriptionId },
      data: { status: nextStatus, updatedAt: now },
    });
  }
}

export async function assertSalesReturnPolicy(
  tx: TxClient,
  input: {
    invoiceDate: bigint;
    returnDate: bigint;
    returnWindowDays: number;
    items: Array<{ medicineId: bigint }>;
    returnRequiresPharmacistForScheduleH: boolean;
    approvedByEmployeeId: bigint | null | undefined;
  },
): Promise<void> {
  const windowMs = BigInt(input.returnWindowDays) * 86_400_000n;
  if (input.returnDate - input.invoiceDate > windowMs) {
    throw new ApplicationException(
      ErrorCode.RETURN_WINDOW_EXCEEDED,
      `Return is outside the ${input.returnWindowDays}-day return window`,
      HttpStatus.CONFLICT,
      {
        invoiceDate: input.invoiceDate.toString(),
        returnDate: input.returnDate.toString(),
      },
    );
  }

  if (!input.returnRequiresPharmacistForScheduleH) {
    return;
  }

  const medicineIds = [...new Set(input.items.map((item) => item.medicineId))];
  const medicines = await tx.medicine.findMany({
    where: { id: { in: medicineIds }, deletedAt: null },
    include: {
      schedule: { select: { scheduleCode: true, controlledSubstance: true } },
    },
  });

  const hasScheduleH = medicines.some(
    (medicine) =>
      medicine.schedule &&
      (medicine.schedule.controlledSubstance ||
        isScheduleHCode(medicine.schedule.scheduleCode)),
  );

  if (hasScheduleH && !input.approvedByEmployeeId) {
    throw new ApplicationException(
      ErrorCode.RETURN_PHARMACIST_APPROVAL_REQUIRED,
      'Schedule H return requires pharmacist approval',
      HttpStatus.CONFLICT,
    );
  }
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

const REFUND_MODE_TO_PAYMENT_METHOD: Record<string, string> = {
  CASH: SalesPaymentMethod.CASH,
  UPI: SalesPaymentMethod.UPI,
  CARD_REVERSAL: SalesPaymentMethod.CREDIT_CARD,
  STORE_CREDIT: SalesPaymentMethod.STORE_CREDIT,
  BANK_TRANSFER: SalesPaymentMethod.NET_BANKING,
};

export function mapRefundModeToPaymentMethod(refundMode: string): string {
  const mapped = REFUND_MODE_TO_PAYMENT_METHOD[refundMode];
  if (!mapped) {
    throw new ApplicationException(
      ErrorCode.BAD_REQUEST,
      `Unsupported refund mode: ${refundMode}`,
      HttpStatus.BAD_REQUEST,
      { refundMode },
    );
  }
  return mapped;
}
