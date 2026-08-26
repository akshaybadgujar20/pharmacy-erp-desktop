import {
  Controller,
  Get,
  HttpStatus,
  Param,
  Query,
  Req,
  StreamableFile,
} from '@nestjs/common';
import type { Request } from 'express';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ApplicationException } from '../common/exceptions/application.exception';
import { ErrorCode } from '../common/exceptions/error-code';
import { PaginatedResult } from '../common/response/paginated-result';
import { getTenantScope } from '../persistence/context/tenant-scope.util';
import { RequestContextService } from '../persistence/context/request-context.service';
import { ReportFormat, EXPORT_MAX_ROWS } from './constants/reporting.constants';
import { ReportRegistryService } from './core/report-registry.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { ReportExporterService } from './export/report-exporter.service';
import {
  validateReportDateRange,
  buildContentDisposition,
} from './utils/report.util';

@Controller('reports')
export class ReportController {
  constructor(
    private readonly registry: ReportRegistryService,
    private readonly exporter: ReportExporterService,
    private readonly requestContext: RequestContextService,
  ) {}

  @Get()
  @RequirePermissions('REPORT_VIEW')
  list(@Req() request: Request) {
    const user = this.getAuthenticatedUser(request);
    return this.registry.listForUser(user.permissions);
  }

  @Get(':reportId')
  @RequirePermissions('REPORT_VIEW')
  async run(
    @Param('reportId') reportId: string,
    @Query() query: ReportQueryDto,
    @Req() request: Request,
  ) {
    const user = this.getAuthenticatedUser(request);
    const definition = this.registry.get(reportId);

    if (!user.permissions.includes(definition.permission)) {
      throw new ApplicationException(
        ErrorCode.AUTH_PERMISSION_DENIED,
        'You do not have permission to run this report',
        HttpStatus.FORBIDDEN,
        { reportId, requiredPermission: definition.permission },
      );
    }

    validateReportDateRange(query.fromDate, query.toDate);

    const scope = getTenantScope(this.requestContext);
    const ctx = {
      scope,
      userId: user.userId,
    };

    const format = query.format ?? ReportFormat.JSON;
    const reportParams =
      format !== ReportFormat.JSON
        ? { ...query, page: 1, pageSize: EXPORT_MAX_ROWS }
        : { ...query };

    const result = await definition.run(reportParams, ctx);

    if (format !== ReportFormat.JSON) {
      const effectiveBranchId = query.branchId ?? scope.branchId;
      const exported = await this.exporter.export(
        definition.id,
        definition.name,
        result,
        {
          ...query,
          branchId: effectiveBranchId,
        },
        format,
      );

      return new StreamableFile(exported.buffer, {
        type: exported.contentType,
        disposition: buildContentDisposition(exported.filename),
      });
    }

    if (result.pagination) {
      return PaginatedResult.of(result.rows, result.pagination);
    }

    return {
      columns: result.columns,
      rows: result.rows,
      totals: result.totals,
    };
  }

  private getAuthenticatedUser(request: Request): AuthenticatedUser {
    const user = request.user as AuthenticatedUser | undefined;

    if (!user) {
      throw new ApplicationException(
        ErrorCode.UNAUTHORIZED,
        'Authentication required',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return user;
  }
}
