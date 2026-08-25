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
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}
