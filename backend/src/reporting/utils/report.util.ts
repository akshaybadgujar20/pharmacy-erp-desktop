import { HttpStatus } from '@nestjs/common';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import type { ReportColumn } from '../core/report-definition.interface';

export function validateReportDateRange(
  fromDate?: string,
  toDate?: string,
): void {
  if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
    throw new ApplicationException(
      ErrorCode.REPORT_INVALID_DATE_RANGE,
      'fromDate must be on or before toDate',
      HttpStatus.BAD_REQUEST,
      { fromDate, toDate },
    );
  }
}

export function sanitizeExportCell(value: string): string {
  if (/^[=+\-@\t\r]/.test(value)) {
    return `'${value}`;
  }

  return value;
}

export function formatCellValue(value: unknown): string {
  if (value == null) {
    return '';
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'bigint'
  ) {
    return String(value);
  }

  return JSON.stringify(value);
}

export function buildCsvContent(
  columns: ReportColumn[],
  rows: Record<string, unknown>[],
): string {
  const header = columns.map((column) => escapeCsvCell(column.label)).join(',');
  const body = rows.map((row) =>
    columns
      .map((column) => escapeCsvCell(formatCellValue(row[column.key])))
      .join(','),
  );

  return [header, ...body].join('\n');
}

function escapeCsvCell(value: string): string {
  const sanitized = sanitizeExportCell(value);

  if (
    sanitized.includes(',') ||
    sanitized.includes('"') ||
    sanitized.includes('\n') ||
    sanitized.includes('\r')
  ) {
    return `"${sanitized.replace(/"/g, '""')}"`;
  }

  return sanitized;
}

export function buildContentDisposition(filename: string): string {
  const asciiFallback = filename
    .replace(/[^\x20-\x7E]/g, '_')
    .replace(/["\\]/g, '_');
  const encoded = encodeURIComponent(filename);

  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}

export function sanitizeWorksheetName(name: string): string {
  const sanitized = name.replace(/[\\/*?:[\]]/g, '_').slice(0, 31);

  return sanitized.length > 0 ? sanitized : 'Report';
}
