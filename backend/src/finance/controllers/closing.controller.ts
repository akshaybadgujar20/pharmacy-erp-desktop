import { Controller, Get, Query } from '@nestjs/common';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { getTenantScope } from '../../persistence/context/tenant-scope.util';
import { RequestContextService } from '../../persistence/context/request-context.service';
import { PreCloseChecklistQueryDto } from '../dto/pre-close-checklist-query.dto';
import { ClosingService } from '../services/closing.service';

@Controller('closing')
export class ClosingController {
  constructor(
    private readonly closingService: ClosingService,
    private readonly requestContext: RequestContextService,
  ) {}

  @Get('pre-close-checklist')
  @RequirePermissions('CONFIGURATION:FINANCIAL_YEAR:READ')
  getPreCloseChecklist(@Query() query: PreCloseChecklistQueryDto) {
    const scope = getTenantScope(this.requestContext);
    return this.closingService.getPreCloseChecklist(
      scope.companyId,
      query.branchId,
    );
  }
}
