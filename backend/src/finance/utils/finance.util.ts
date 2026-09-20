import { randomUUID } from 'crypto';
import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import type { TxClient } from '../../persistence/prisma/prisma-tx.type';
import { assertTransactionDateInOpenYear as assertTransactionDateInOpenYearImpl } from '../../persistence/ledger/ledger-posting.util';
import type { JournalLineInput } from '../../persistence/ledger/ledger-posting.types';
import {
  SalesPaymentStatus,
  SalesReturnStatus,
} from '../../sales/constants/sales.constants';
import {
  BANK_PAYMENT_METHODS,
  CASH_PAYMENT_METHODS,
  FinanceReferenceType,
  PaymentType,
  ReceiptStatus,
  ReceiptType,
  SALES_BANK_PAYMENT_METHODS,
  SALES_CASH_PAYMENT_METHODS,
  SystemLedgerCode,
} from '../constants/finance.constants';

export const assertTransactionDateInOpenYear =
  assertTransactionDateInOpenYearImpl;

const LEDGER_SUPPORTED_PAYMENT_TYPES = [
  PaymentType.SUPPLIER_PAYMENT,
  PaymentType.EXPENSE,
  PaymentType.CUSTOMER_REFUND,
  PaymentType.PURCHASE_REFUND,
] as const;

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

export function assertPaymentTypeSupportsLedger(paymentType: string): void {
  if (
    !(LEDGER_SUPPORTED_PAYMENT_TYPES as readonly string[]).includes(paymentType)
  ) {
    throw new ApplicationException(
      ErrorCode.PAYMENT_TYPE_NOT_SUPPORTED,
      'Payment type is not supported for ledger posting',
      HttpStatus.BAD_REQUEST,
      { paymentType },
    );
  }
}

export async function resolveSystemLedger(
  tx: TxClient,
  ledgerCode: string,
): Promise<{ id: bigint; normalBalance: string }> {
  const ledger = await tx.ledger.findFirst({
    where: { ledgerCode, deletedAt: null, isActive: true },
    select: { id: true, normalBalance: true },
  });

  if (!ledger) {
    throw new ApplicationException(
      ErrorCode.LEDGER_NOT_FOUND,
      `System ledger not found: ${ledgerCode}`,
      HttpStatus.NOT_FOUND,
      { ledgerCode },
    );
  }

  return ledger;
}

export async function adjustSupplierOutstanding(
  tx: TxClient,
  supplierId: bigint,
  delta: Prisma.Decimal,
): Promise<void> {
  const supplier = await tx.supplier.findFirst({
    where: { id: supplierId, deletedAt: null },
    select: { id: true, outstandingAmount: true, version: true },
  });

  if (!supplier) {
    throw new ApplicationException(
      ErrorCode.SUPPLIER_NOT_FOUND,
      `Supplier not found: ${supplierId}`,
      HttpStatus.NOT_FOUND,
      { supplierId: supplierId.toString() },
    );
  }

  const updateResult = await tx.supplier.updateMany({
    where: { id: supplierId, version: supplier.version, deletedAt: null },
    data: {
      outstandingAmount: new Prisma.Decimal(supplier.outstandingAmount).add(
        delta,
      ),
      updatedAt: BigInt(Date.now()),
      version: { increment: 1 },
    },
  });

  optimisticUpdate(
    updateResult,
    supplierId,
    `Supplier outstanding version conflict: ${supplierId}`,
  );
}

export async function adjustCustomerOutstanding(
  tx: TxClient,
  customerId: bigint,
  delta: Prisma.Decimal,
): Promise<void> {
  const customer = await tx.customer.findFirst({
    where: { id: customerId, deletedAt: null },
    select: { id: true, outstandingAmount: true, version: true },
  });

  if (!customer) {
    throw new ApplicationException(
      ErrorCode.CUSTOMER_NOT_FOUND,
      `Customer not found: ${customerId}`,
      HttpStatus.NOT_FOUND,
      { customerId: customerId.toString() },
    );
  }

  const updateResult = await tx.customer.updateMany({
    where: { id: customerId, version: customer.version, deletedAt: null },
    data: {
      outstandingAmount: new Prisma.Decimal(customer.outstandingAmount).add(
        delta,
      ),
      updatedAt: BigInt(Date.now()),
      version: { increment: 1 },
    },
  });

  optimisticUpdate(
    updateResult,
    customerId,
    `Customer outstanding version conflict: ${customerId}`,
  );
}

const ZERO_AMOUNT = new Prisma.Decimal(0);

function twoLineEntry(
  debitLedgerId: bigint,
  creditLedgerId: bigint,
  amount: Prisma.Decimal,
  narration?: string,
): JournalLineInput[] {
  return [
    {
      ledgerId: debitLedgerId,
      debitAmount: amount,
      creditAmount: ZERO_AMOUNT,
      narration,
    },
    {
      ledgerId: creditLedgerId,
      debitAmount: ZERO_AMOUNT,
      creditAmount: amount,
      narration,
    },
  ];
}

async function resolveCashOrBankLedger(
  tx: TxClient,
  paymentMethod: string,
): Promise<bigint> {
  const isBank = (BANK_PAYMENT_METHODS as readonly string[]).includes(
    paymentMethod,
  );
  const isCash = (CASH_PAYMENT_METHODS as readonly string[]).includes(
    paymentMethod,
  );

  if (!isBank && !isCash) {
    throw new ApplicationException(
      ErrorCode.BAD_REQUEST,
      `Unsupported payment method: ${paymentMethod}`,
      HttpStatus.BAD_REQUEST,
      { paymentMethod },
    );
  }

  const ledgerCode = isBank ? SystemLedgerCode.BANK : SystemLedgerCode.CASH;
  const ledger = await resolveSystemLedger(tx, ledgerCode);
  return ledger.id;
}

export async function buildPaymentLedgerLines(
  tx: TxClient,
  input: {
    amount: Prisma.Decimal;
    paymentMethod: string;
    paymentType: string;
    narration?: string;
  },
): Promise<JournalLineInput[]> {
  const amount = new Prisma.Decimal(input.amount);
  const cashOrBankLedgerId = await resolveCashOrBankLedger(
    tx,
    input.paymentMethod,
  );

  if (input.paymentType === PaymentType.SUPPLIER_PAYMENT) {
    const payable = await resolveSystemLedger(
      tx,
      SystemLedgerCode.SUPPLIER_PAYABLE,
    );
    return twoLineEntry(
      payable.id,
      cashOrBankLedgerId,
      amount,
      input.narration,
    );
  }

  if (input.paymentType === PaymentType.EXPENSE) {
    const expense = await resolveSystemLedger(tx, SystemLedgerCode.PURCHASE);
    return twoLineEntry(
      expense.id,
      cashOrBankLedgerId,
      amount,
      input.narration,
    );
  }

  if (input.paymentType === PaymentType.CUSTOMER_REFUND) {
    const receivable = await resolveSystemLedger(
      tx,
      SystemLedgerCode.CUSTOMER_RECEIVABLE,
    );
    return twoLineEntry(
      receivable.id,
      cashOrBankLedgerId,
      amount,
      input.narration,
    );
  }

  if (input.paymentType === PaymentType.PURCHASE_REFUND) {
    const payable = await resolveSystemLedger(
      tx,
      SystemLedgerCode.SUPPLIER_PAYABLE,
    );
    return twoLineEntry(
      cashOrBankLedgerId,
      payable.id,
      amount,
      input.narration,
    );
  }

  throw new ApplicationException(
    ErrorCode.PAYMENT_TYPE_NOT_SUPPORTED,
    'Payment type is not supported for ledger posting',
    HttpStatus.BAD_REQUEST,
    { paymentType: input.paymentType },
  );
}

export async function adjustPurchaseInvoicePaymentAllocation(
  tx: TxClient,
  invoiceId: bigint,
  signedDelta: Prisma.Decimal,
): Promise<{ supplierId: bigint }> {
  const invoice = await tx.purchaseInvoice.findFirst({
    where: { id: invoiceId, deletedAt: null },
  });

  if (!invoice) {
    throwNotFound(
      ErrorCode.PURCHASE_INVOICE_NOT_FOUND,
      `Purchase invoice not found: ${invoiceId}`,
      { id: invoiceId.toString() },
    );
  }

  const paidAmount = new Prisma.Decimal(invoice.paidAmount).add(signedDelta);
  const balanceAmount = new Prisma.Decimal(invoice.netAmount).sub(paidAmount);

  const updateResult = await tx.purchaseInvoice.updateMany({
    where: { id: invoiceId, version: invoice.version, deletedAt: null },
    data: {
      paidAmount,
      balanceAmount,
      paymentStatus: computePurchaseInvoicePaymentStatus(
        new Prisma.Decimal(invoice.netAmount),
        paidAmount,
      ),
      updatedAt: BigInt(Date.now()),
      version: { increment: 1 },
    },
  });

  optimisticUpdate(
    updateResult,
    invoiceId,
    `Purchase invoice allocation version conflict: ${invoiceId}`,
  );

  return { supplierId: invoice.supplierId };
}

export async function buildReceiptLedgerLines(
  tx: TxClient,
  input: {
    amount: Prisma.Decimal;
    receiptMethod: string;
    narration?: string;
  },
): Promise<JournalLineInput[]> {
  const amount = new Prisma.Decimal(input.amount);
  const cashOrBankLedgerId = await resolveCashOrBankLedger(
    tx,
    input.receiptMethod,
  );
  const receivable = await resolveSystemLedger(
    tx,
    SystemLedgerCode.CUSTOMER_RECEIVABLE,
  );

  return twoLineEntry(
    cashOrBankLedgerId,
    receivable.id,
    amount,
    input.narration,
  );
}

export async function buildPurchaseInvoiceLedgerLines(
  tx: TxClient,
  input: {
    netAmount: Prisma.Decimal;
    taxAmount: Prisma.Decimal;
    narration?: string;
  },
): Promise<JournalLineInput[]> {
  const netAmount = new Prisma.Decimal(input.netAmount);
  const taxAmount = new Prisma.Decimal(input.taxAmount);
  const purchaseAmount = netAmount.sub(taxAmount);

  const purchase = await resolveSystemLedger(tx, SystemLedgerCode.PURCHASE);
  const gstInput = await resolveSystemLedger(tx, SystemLedgerCode.GST_INPUT);
  const payable = await resolveSystemLedger(
    tx,
    SystemLedgerCode.SUPPLIER_PAYABLE,
  );

  const lines: JournalLineInput[] = [];

  if (purchaseAmount.gt(0)) {
    lines.push({
      ledgerId: purchase.id,
      debitAmount: purchaseAmount,
      creditAmount: new Prisma.Decimal(0),
      narration: input.narration,
    });
  }

  if (taxAmount.gt(0)) {
    lines.push({
      ledgerId: gstInput.id,
      debitAmount: taxAmount,
      creditAmount: new Prisma.Decimal(0),
      narration: input.narration,
    });
  }

  lines.push({
    ledgerId: payable.id,
    debitAmount: new Prisma.Decimal(0),
    creditAmount: netAmount,
    narration: input.narration,
  });

  return lines;
}

export function computePurchaseInvoicePaymentStatus(
  netAmount: Prisma.Decimal,
  paidAmount: Prisma.Decimal,
): string {
  if (paidAmount.lte(0)) {
    return 'UNPAID';
  }
  if (paidAmount.gte(netAmount)) {
    return 'PAID';
  }
  return 'PARTIALLY_PAID';
}

export async function assertLedgerExists(
  tx: TxClient,
  ledgerId: bigint,
): Promise<{ id: bigint; isSystem: boolean; parentLedgerId: bigint | null }> {
  const ledger = await tx.ledger.findFirst({
    where: { id: ledgerId, deletedAt: null },
    select: { id: true, isSystem: true, parentLedgerId: true },
  });

  if (!ledger) {
    throwNotFound(ErrorCode.LEDGER_NOT_FOUND, `Ledger not found: ${ledgerId}`, {
      id: ledgerId.toString(),
    });
  }

  return ledger;
}

export async function assertNoCircularLedgerParent(
  tx: TxClient,
  ledgerId: bigint,
  parentLedgerId: bigint,
): Promise<void> {
  if (ledgerId === parentLedgerId) {
    throw new ApplicationException(
      ErrorCode.LEDGER_CIRCULAR_HIERARCHY,
      'Ledger cannot be its own parent',
      HttpStatus.BAD_REQUEST,
      { ledgerId: ledgerId.toString() },
    );
  }

  let currentParentId: bigint | null = parentLedgerId;
  const visited = new Set<string>();

  while (currentParentId != null) {
    const key = currentParentId.toString();
    if (visited.has(key)) {
      throw new ApplicationException(
        ErrorCode.LEDGER_CIRCULAR_HIERARCHY,
        'Circular ledger hierarchy detected',
        HttpStatus.BAD_REQUEST,
        { ledgerId: ledgerId.toString(), parentLedgerId: key },
      );
    }
    visited.add(key);

    const parent: { parentLedgerId: bigint | null } | null =
      await tx.ledger.findFirst({
        where: { id: currentParentId, deletedAt: null },
        select: { parentLedgerId: true },
      });

    if (!parent) {
      break;
    }

    if (parent.parentLedgerId === ledgerId) {
      throw new ApplicationException(
        ErrorCode.LEDGER_CIRCULAR_HIERARCHY,
        'Circular ledger hierarchy detected',
        HttpStatus.BAD_REQUEST,
        { ledgerId: ledgerId.toString() },
      );
    }

    currentParentId = parent.parentLedgerId;
  }
}

export function newLedgerUuid(): string {
  return randomUUID();
}

export function isPurchaseInvoiceReference(
  referenceType: string | null,
): boolean {
  return referenceType === FinanceReferenceType.PURCHASE_INVOICE;
}

export function isSalesInvoiceReference(referenceType: string | null): boolean {
  return referenceType === FinanceReferenceType.SALES_INVOICE;
}

export async function resolveReceiptCustomerId(
  tx: TxClient,
  receipt: {
    referenceType: string | null;
    referenceId: bigint | null;
    receiptType: string;
  },
  options?: { validateSalesInvoiceAmount?: Prisma.Decimal },
): Promise<bigint | undefined> {
  if (isSalesInvoiceReference(receipt.referenceType)) {
    if (!receipt.referenceId) {
      throw new ApplicationException(
        ErrorCode.BAD_REQUEST,
        'Sales invoice reference is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (options?.validateSalesInvoiceAmount !== undefined) {
      const { customerId } = await assertSalesInvoiceReceiptAmount(
        tx,
        receipt.referenceId,
        options.validateSalesInvoiceAmount,
      );
      return customerId ?? undefined;
    }

    const invoice = await tx.salesInvoice.findFirstOrThrow({
      where: { id: receipt.referenceId },
    });
    return invoice.customerId ?? undefined;
  }

  if (receipt.referenceType === FinanceReferenceType.CUSTOMER) {
    return receipt.referenceId ?? undefined;
  }

  if (
    receipt.receiptType === ReceiptType.CUSTOMER_PAYMENT &&
    receipt.referenceId
  ) {
    return receipt.referenceId;
  }

  return undefined;
}

async function resolveSalesCashOrBankLedger(
  tx: TxClient,
  paymentMethod: string,
): Promise<bigint> {
  const isBank = (SALES_BANK_PAYMENT_METHODS as readonly string[]).includes(
    paymentMethod,
  );
  const isCash = (SALES_CASH_PAYMENT_METHODS as readonly string[]).includes(
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
      status: SalesReturnStatus.COMPLETED,
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
    invoiceBalance?: Prisma.Decimal;
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
  const invoiceBalance =
    input.invoiceBalance !== undefined
      ? new Prisma.Decimal(input.invoiceBalance)
      : amount;
  const appliedAmount = Prisma.Decimal.min(amount, invoiceBalance);
  const advanceAmount = amount.sub(appliedAmount);

  const cashOrBankLedgerId = await resolveSalesCashOrBankLedger(
    tx,
    input.paymentMethod,
  );
  const receivable = await resolveSystemLedger(
    tx,
    SystemLedgerCode.CUSTOMER_RECEIVABLE,
  );

  const lines: JournalLineInput[] = [
    {
      ledgerId: cashOrBankLedgerId,
      debitAmount: amount,
      creditAmount: new Prisma.Decimal(0),
      narration: input.narration,
    },
  ];

  if (appliedAmount.gt(0)) {
    lines.push({
      ledgerId: receivable.id,
      debitAmount: new Prisma.Decimal(0),
      creditAmount: appliedAmount,
      narration: input.narration,
    });
  }

  if (advanceAmount.gt(0)) {
    const advance = await resolveSystemLedger(
      tx,
      SystemLedgerCode.CUSTOMER_ADVANCE,
    );
    lines.push({
      ledgerId: advance.id,
      debitAmount: new Prisma.Decimal(0),
      creditAmount: advanceAmount,
      narration: input.narration,
    });
  }

  return lines;
}

export async function buildPurchaseReturnLedgerLines(
  tx: TxClient,
  input: {
    netAmount: Prisma.Decimal;
    taxAmount: Prisma.Decimal;
    narration?: string;
  },
): Promise<JournalLineInput[]> {
  const netAmount = new Prisma.Decimal(input.netAmount);
  const taxAmount = new Prisma.Decimal(input.taxAmount);
  const purchaseAmount = netAmount.sub(taxAmount);

  const purchase = await resolveSystemLedger(tx, SystemLedgerCode.PURCHASE);
  const gstInput = await resolveSystemLedger(tx, SystemLedgerCode.GST_INPUT);
  const payable = await resolveSystemLedger(
    tx,
    SystemLedgerCode.SUPPLIER_PAYABLE,
  );

  const lines: JournalLineInput[] = [
    {
      ledgerId: payable.id,
      debitAmount: netAmount,
      creditAmount: new Prisma.Decimal(0),
      narration: input.narration,
    },
  ];

  if (purchaseAmount.gt(0)) {
    lines.push({
      ledgerId: purchase.id,
      debitAmount: new Prisma.Decimal(0),
      creditAmount: purchaseAmount,
      narration: input.narration,
    });
  }

  if (taxAmount.gt(0)) {
    lines.push({
      ledgerId: gstInput.id,
      debitAmount: new Prisma.Decimal(0),
      creditAmount: taxAmount,
      narration: input.narration,
    });
  }

  return lines;
}

export async function buildSalesRefundLedgerLines(
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
      'Sales refund requires a customer on the invoice',
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
      ledgerId: receivable.id,
      debitAmount: amount,
      creditAmount: new Prisma.Decimal(0),
      narration: input.narration,
    },
    {
      ledgerId: cashOrBankLedgerId,
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
        status: {
          in: [SalesPaymentStatus.COMPLETED, SalesPaymentStatus.REFUNDED],
        },
        deletedAt: null,
      },
      select: { paymentAmount: true, status: true },
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
    if (payment.status === SalesPaymentStatus.REFUNDED) {
      paidAmount = paidAmount.sub(payment.paymentAmount);
    } else {
      paidAmount = paidAmount.add(payment.paymentAmount);
    }
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
