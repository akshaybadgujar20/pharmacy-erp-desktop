import { Controller, Get, Param, Query } from '@nestjs/common';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import { AuditLogListQueryDto } from '../dto/audit-log-list-query.dto';
import { AuditLogService } from '../services/audit-log.service';

@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @RequirePermissions('AUDIT:AUDIT_LOG:READ')
  list(@Query() query: AuditLogListQueryDto) {
    return this.auditLogService.list(query);
  }

  @Get(':id')
  @RequirePermissions('AUDIT:AUDIT_LOG:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.auditLogService.getById(id);
  }
}
