import { Controller, Get, Param, Query } from '@nestjs/common';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import { SyncLogListQueryDto } from '../dto/sync-log-list-query.dto';
import { SyncLogService } from '../services/sync-log.service';

@Controller('sync-logs')
export class SyncLogController {
  constructor(private readonly syncLogService: SyncLogService) {}

  @Get()
  @RequirePermissions('SYNC:SYNC_LOG:READ')
  list(@Query() query: SyncLogListQueryDto) {
    return this.syncLogService.list(query);
  }

  @Get(':id')
  @RequirePermissions('SYNC:SYNC_LOG:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.syncLogService.getById(id);
  }
}
