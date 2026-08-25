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
} as const;

export const ReportCategory = {
  PARTY: 'party',
} as const;
