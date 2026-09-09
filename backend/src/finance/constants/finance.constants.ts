export const PaymentStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;

export const ReceiptStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  REVERSED: 'REVERSED',
} as const;

export const PaymentType = {
  SUPPLIER_PAYMENT: 'SUPPLIER_PAYMENT',
  CUSTOMER_REFUND: 'CUSTOMER_REFUND',
  ADVANCE: 'ADVANCE',
  EXPENSE: 'EXPENSE',
  PURCHASE_REFUND: 'PURCHASE_REFUND',
} as const;

export const ReceiptType = {
  CUSTOMER_PAYMENT: 'CUSTOMER_PAYMENT',
  ADVANCE: 'ADVANCE',
  REFUND: 'REFUND',
  INTEREST: 'INTEREST',
  OTHER: 'OTHER',
} as const;

export const PaymentMethod = {
  CASH: 'CASH',
  UPI: 'UPI',
  CARD: 'CARD',
  CHEQUE: 'CHEQUE',
  BANK_TRANSFER: 'BANK_TRANSFER',
} as const;

export const VoucherType = {
  SALES: 'SALES',
  PURCHASE: 'PURCHASE',
  PAYMENT: 'PAYMENT',
  RECEIPT: 'RECEIPT',
  JOURNAL: 'JOURNAL',
  OPENING: 'OPENING',
} as const;

export const LedgerType = {
  ASSET: 'ASSET',
  LIABILITY: 'LIABILITY',
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
  EQUITY: 'EQUITY',
} as const;

export const NormalBalance = {
  DEBIT: 'DEBIT',
  CREDIT: 'CREDIT',
} as const;

export const FinanceReferenceType = {
  PURCHASE_INVOICE: 'PURCHASE_INVOICE',
  SALES_INVOICE: 'SALES_INVOICE',
  CUSTOMER: 'CUSTOMER',
  SUPPLIER: 'SUPPLIER',
  EXPENSE: 'EXPENSE',
} as const;

export const SystemLedgerCode = {
  CASH: 'CASH001',
  BANK: 'BANK001',
  SALES: 'SALE001',
  PURCHASE: 'PUR001',
  SUPPLIER_PAYABLE: 'SUP001',
  CUSTOMER_RECEIVABLE: 'CUST001',
  GST_INPUT: 'GSTIN001',
  GST_OUTPUT: 'GSTOUT001',
  INVENTORY: 'INV001',
} as const;

export const CASH_PAYMENT_METHODS = [
  PaymentMethod.CASH,
  PaymentMethod.UPI,
  PaymentMethod.CARD,
] as const;

export const BANK_PAYMENT_METHODS = [
  PaymentMethod.CHEQUE,
  PaymentMethod.BANK_TRANSFER,
] as const;
