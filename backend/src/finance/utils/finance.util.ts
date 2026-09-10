import { randomUUID } from 'crypto';
import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import type { TxClient } from '../../persistence/prisma/prisma-tx.type';
import { assertTransactionDateInOpenYear as assertTransactionDateInOpenYearImpl } from '../../persistence/ledger/ledger-posting.util';
import {
  BANK_PAYMENT_METHODS,
  CASH_PAYMENT_METHODS,
  FinanceReferenceType,
  PaymentType,
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

export interface JournalLineInput {
  ledgerId: bigint;
  debitAmount: Prisma.Decimal;
  creditAmount: Prisma.Decimal;
  narration?: string;
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
    return [
      {
        ledgerId: payable.id,
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

  if (input.paymentType === PaymentType.EXPENSE) {
    const expense = await resolveSystemLedger(tx, SystemLedgerCode.PURCHASE);
    return [
      {
        ledgerId: expense.id,
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

  if (input.paymentType === PaymentType.CUSTOMER_REFUND) {
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

  if (input.paymentType === PaymentType.PURCHASE_REFUND) {
    const payable = await resolveSystemLedger(
      tx,
      SystemLedgerCode.SUPPLIER_PAYABLE,
    );
    return [
      {
        ledgerId: cashOrBankLedgerId,
        debitAmount: amount,
        creditAmount: new Prisma.Decimal(0),
        narration: input.narration,
      },
      {
        ledgerId: payable.id,
        debitAmount: new Prisma.Decimal(0),
        creditAmount: amount,
        narration: input.narration,
      },
    ];
  }

  throw new ApplicationException(
    ErrorCode.PAYMENT_TYPE_NOT_SUPPORTED,
    'Payment type is not supported for ledger posting',
    HttpStatus.BAD_REQUEST,
    { paymentType: input.paymentType },
  );
}

export async function applyPurchaseInvoicePaymentAllocation(
  tx: TxClient,
  invoiceId: bigint,
  amount: Prisma.Decimal,
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

  const paidAmount = new Prisma.Decimal(invoice.paidAmount).add(amount);
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

export async function reversePurchaseInvoicePaymentAllocation(
  tx: TxClient,
  invoiceId: bigint,
  amount: Prisma.Decimal,
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

  const paidAmount = new Prisma.Decimal(invoice.paidAmount).sub(amount);
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
