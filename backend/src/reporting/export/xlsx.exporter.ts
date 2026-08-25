import ExcelJS from 'exceljs';
import type { ExportInput, ExportOutput } from './csv.exporter';
import { formatCellValue } from '../utils/report.util';

export async function exportXlsx(input: ExportInput): Promise<ExportOutput> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(input.reportName);

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
      input.columns.map((column) => formatCellValue(row[column.key])),
    );
  }

  if (input.totals) {
    worksheet.addRow([]);
    worksheet.addRow(
      Object.entries(input.totals).map(
        ([key, value]) => `${key}: ${formatCellValue(value)}`,
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
