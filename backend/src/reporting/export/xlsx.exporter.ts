import ExcelJS from 'exceljs';
import type { ExportInput, ExportOutput } from './csv.exporter';
import {
  formatCellValue,
  sanitizeExportCell,
  sanitizeWorksheetName,
} from '../utils/report.util';

function sanitizeCellValue(value: unknown): string {
  return sanitizeExportCell(formatCellValue(value));
}

export async function exportXlsx(input: ExportInput): Promise<ExportOutput> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(
    sanitizeWorksheetName(input.reportName),
  );

  worksheet.addRow([input.reportName]);
  if (input.fromDate || input.toDate) {
    worksheet.addRow([
      `Period: ${input.fromDate ?? ''} - ${input.toDate ?? ''}`,
    ]);
  }
  if (input.branchId) {
    worksheet.addRow([`Branch: ${input.branchId}`]);
  }
  worksheet.addRow([]);

  worksheet.addRow(input.columns.map((column) => column.label));
  for (const row of input.rows) {
    worksheet.addRow(
      input.columns.map((column) => sanitizeCellValue(row[column.key])),
    );
  }

  if (input.totals) {
    worksheet.addRow([]);
    worksheet.addRow(
      Object.entries(input.totals).map(
        ([key, value]) => `${key}: ${sanitizeCellValue(value)}`,
      ),
    );
  }

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

  return {
    buffer,
    contentType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    filename: `${input.reportId}.xlsx`,
  };
}
