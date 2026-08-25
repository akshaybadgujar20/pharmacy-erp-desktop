import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import { ReportFormat } from '../constants/reporting.constants';
import type { ReportResult } from '../core/report-definition.interface';
import type { ReportQueryDto } from '../dto/report-query.dto';
import { exportCsv, type ExportInput, type ExportOutput } from './csv.exporter';
import { exportPdf } from './pdf.exporter';
import { exportXlsx } from './xlsx.exporter';

@Injectable()
export class ReportExporterService {
  async export(
    reportId: string,
    reportName: string,
    result: ReportResult,
    query: ReportQueryDto,
    format: ReportFormat,
  ): Promise<ExportOutput> {
    const input: ExportInput = {
      reportId,
      reportName,
      columns: result.columns,
      rows: result.rows,
      totals: result.totals,
      fromDate: query.fromDate,
      toDate: query.toDate,
      branchId: query.branchId?.toString(),
    };

    switch (format) {
      case ReportFormat.CSV:
        return exportCsv(input);
      case ReportFormat.XLSX:
        return await exportXlsx(input);
      case ReportFormat.PDF:
        return await exportPdf(input);
      default:
        throw new ApplicationException(
          ErrorCode.REPORT_UNSUPPORTED_FORMAT,
          `Unsupported export format: ${format}`,
          HttpStatus.BAD_REQUEST,
          { format },
        );
    }
  }
}
