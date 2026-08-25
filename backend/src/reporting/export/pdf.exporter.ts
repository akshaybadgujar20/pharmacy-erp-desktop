import path from 'node:path';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfmake = require('pdfmake') as {
  setFonts: (fonts: Record<string, Record<string, string>>) => void;
  createPdf: (docDefinition: TDocumentDefinitions) => {
    getBuffer: () => Promise<Buffer>;
  };
};

import type { ExportInput, ExportOutput } from './csv.exporter';
import { formatCellValue } from '../utils/report.util';

const pdfmakeRoot = path.dirname(require.resolve('pdfmake/package.json'));
const robotoDir = path.join(pdfmakeRoot, 'build', 'fonts', 'Roboto');

pdfmake.setFonts({
  Roboto: {
    normal: path.join(robotoDir, 'Roboto-Regular.ttf'),
    bold: path.join(robotoDir, 'Roboto-Medium.ttf'),
    italics: path.join(robotoDir, 'Roboto-Italic.ttf'),
    bolditalics: path.join(robotoDir, 'Roboto-MediumItalic.ttf'),
  },
});

export async function exportPdf(input: ExportInput): Promise<ExportOutput> {
  const headerLines: string[] = [input.reportName];
  if (input.fromDate || input.toDate) {
    headerLines.push(`Period: ${input.fromDate ?? ''} - ${input.toDate ?? ''}`);
  }
  if (input.branchId) {
    headerLines.push(`Branch: ${input.branchId}`);
  }

  const tableBody: (string | { text: string; bold?: boolean })[][] = [
    input.columns.map((column) => ({ text: column.label, bold: true })),
    ...input.rows.map((row) =>
      input.columns.map((column) => formatCellValue(row[column.key])),
    ),
  ];

  const content: NonNullable<TDocumentDefinitions['content']> = [
    { text: headerLines.join('\n'), margin: [0, 0, 0, 12] },
    {
      table: {
        headerRows: 1,
        widths: input.columns.map(() => 'auto'),
        body: tableBody,
      },
      layout: 'lightHorizontalLines',
    },
  ];

  if (input.totals) {
    content.push({
      text: Object.entries(input.totals)
        .map(([key, value]) => `${key}: ${formatCellValue(value)}`)
        .join('\n'),
      margin: [0, 12, 0, 0],
    });
  }

  const docDefinition: TDocumentDefinitions = {
    defaultStyle: { font: 'Roboto', fontSize: 9 },
    content,
  };

  const buffer = await pdfmake.createPdf(docDefinition).getBuffer();

  return {
    buffer,
    contentType: 'application/pdf',
    filename: `${input.reportId}.pdf`,
  };
}
