import { Test, TestingModule } from '@nestjs/testing';
import { ReportFormat } from '../constants/reporting.constants';
import { ReportColumnTypes } from '../core/report-definition.interface';
import { ReportExporterService } from './report-exporter.service';

describe('ReportExporterService', () => {
  let service: ReportExporterService;

  const sampleResult = {
    columns: [
      { key: 'code', label: 'Code', type: ReportColumnTypes.STRING },
      { key: 'amount', label: 'Amount', type: ReportColumnTypes.DECIMAL },
    ],
    rows: [
      { code: 'C001', amount: '100.50' },
      { code: 'C002', amount: '0' },
    ],
    totals: { grandTotal: '100.50' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportExporterService],
    }).compile();

    service = module.get(ReportExporterService);
  });

  it('exports CSV with expected content type', async () => {
    const output = await service.export(
      'party.customer-list',
      'Customer List',
      sampleResult,
      { format: ReportFormat.CSV },
      ReportFormat.CSV,
    );

    expect(output.contentType).toContain('text/csv');
    expect(output.filename).toBe('party.customer-list.csv');
    expect(output.buffer.length).toBeGreaterThan(0);
    expect(output.buffer.toString('utf-8')).toContain('Code');
    expect(output.buffer.toString('utf-8')).toContain('C001');
  });

  it('exports XLSX with spreadsheet content type', async () => {
    const output = await service.export(
      'party.customer-list',
      'Customer List',
      sampleResult,
      {
        format: ReportFormat.XLSX,
        fromDate: '2026-01-01',
        toDate: '2026-01-31',
      },
      ReportFormat.XLSX,
    );

    expect(output.contentType).toContain('spreadsheetml');
    expect(output.filename).toBe('party.customer-list.xlsx');
    expect(output.buffer.length).toBeGreaterThan(0);
  });

  it('exports PDF with pdf content type', async () => {
    const output = await service.export(
      'party.customer-list',
      'Customer List',
      sampleResult,
      { format: ReportFormat.PDF },
      ReportFormat.PDF,
    );

    expect(output.contentType).toBe('application/pdf');
    expect(output.filename).toBe('party.customer-list.pdf');
    expect(output.buffer.length).toBeGreaterThan(0);
    expect(output.buffer.subarray(0, 4).toString()).toBe('%PDF');
  });
});
