export const FinancialYearStatus = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type FinancialYearStatus =
  (typeof FinancialYearStatus)[keyof typeof FinancialYearStatus];

export {
  DocumentType,
  ResetPolicy,
} from '../../persistence/sequence/document-type.constants';

export const PrinterType = {
  LASER: 'LASER',
  THERMAL: 'THERMAL',
  LABEL: 'LABEL',
  DOT_MATRIX: 'DOT_MATRIX',
  PDF: 'PDF',
} as const;

export const PrintOrientation = {
  PORTRAIT: 'PORTRAIT',
  LANDSCAPE: 'LANDSCAPE',
} as const;

export const PrinterDocumentType = {
  SALES_INVOICE: 'SALES_INVOICE',
  PURCHASE_INVOICE: 'PURCHASE_INVOICE',
  PURCHASE_ORDER: 'PURCHASE_ORDER',
  RECEIPT: 'RECEIPT',
  PAYMENT: 'PAYMENT',
  LABEL: 'LABEL',
  BARCODE_LABEL: 'BARCODE_LABEL',
  PRESCRIPTION: 'PRESCRIPTION',
  REPORT: 'REPORT',
} as const;

export const BarcodeType = {
  CODE128: 'CODE128',
  CODE39: 'CODE39',
  EAN13: 'EAN13',
  EAN8: 'EAN8',
  QR: 'QR',
  QR_CODE: 'QR_CODE',
  DATA_MATRIX: 'DATA_MATRIX',
} as const;

export const BarcodeAppliesTo = {
  MEDICINE: 'MEDICINE',
  BATCH: 'BATCH',
  SHELF: 'SHELF',
  INVOICE: 'INVOICE',
  CUSTOMER: 'CUSTOMER',
} as const;
