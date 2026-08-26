import type { ReportColumn } from '../core/report-definition.interface';
import { buildCsvContent, formatCellValue } from '../utils/report.util';

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
  const lines = [buildCsvContent(input.columns, input.rows)];

  if (input.totals) {
    lines.push('');
    lines.push(
      Object.entries(input.totals)
        .map(([key, value]) => `${key}: ${formatCellValue(value)}`)
        .join('\n'),
    );
  }

  const buffer = Buffer.from(lines.join('\n'), 'utf-8');

  return {
    buffer,
    contentType: 'text/csv; charset=utf-8',
    filename: `${input.reportId}.csv`,
  };
}
