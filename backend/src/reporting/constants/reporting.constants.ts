export const ReportFormat = {
  JSON: 'json',
  CSV: 'csv',
  XLSX: 'xlsx',
  PDF: 'pdf',
} as const;

export type ReportFormat = (typeof ReportFormat)[keyof typeof ReportFormat];

export const REPORT_FORMATS: ReportFormat[] = [
  ReportFormat.JSON,
  ReportFormat.CSV,
  ReportFormat.XLSX,
  ReportFormat.PDF,
];

export const ReportPermission = {
  PARTY_VIEW: 'REPORT_PARTY_VIEW',
  SALES_VIEW: 'REPORT_SALES_VIEW',
  PURCHASE_VIEW: 'REPORT_PURCHASE_VIEW',
  INVENTORY_VIEW: 'REPORT_INVENTORY_VIEW',
  FINANCE_VIEW: 'REPORT_FINANCE_VIEW',
} as const;

export const ReportCategory = {
  PARTY: 'party',
  SALES: 'sales',
  PURCHASE: 'purchase',
  INVENTORY: 'inventory',
  FINANCE: 'finance',
} as const;

export const EXPORT_MAX_ROWS = 10_000;
