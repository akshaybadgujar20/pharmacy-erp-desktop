import type { ReportColumn } from '../core/report-definition.interface';
import { buildCsvContent } from '../utils/report.util';

export interface ExportInput {
  reportId: string;
  reportName: string;
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
  totals?: Record<string, unknown>;
  fromDate?: string;
  toDate?: string;
  branchId?: string;
}

export interface ExportOutput {
  buffer: Buffer;
  contentType: string;
  filename: string;
}

export function exportCsv(input: ExportInput): ExportOutput {
  const csvContent = buildCsvContent(input.columns, input.rows);
  const buffer = Buffer.from(csvContent, 'utf-8');

  return {
    buffer,
    contentType: 'text/csv; charset=utf-8',
    filename: `${input.reportId}.csv`,
  };
}
