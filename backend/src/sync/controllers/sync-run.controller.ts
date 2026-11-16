import { Controller, Get, Headers, Post } from '@nestjs/common';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { SyncRunService } from '../services/sync-run.service';

@Controller('sync/runs')
export class SyncRunController {
  constructor(private readonly syncRunService: SyncRunService) {}

  @Post()
  @RequirePermissions('SYNC:SYNC:EXECUTE')
  run(@Headers('authorization') authorization?: string) {
    return this.syncRunService.runPushAndPull(authorization);
  }

  @Get('latest')
  @RequirePermissions('SYNC:SYNC_LOG:READ')
  latest() {
    return this.syncRunService.getLatestRun();
  }
}
