import { Controller, Get, Post } from '@nestjs/common';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { SyncRunService } from '../services/sync-run.service';

@Controller('sync/runs')
export class SyncRunController {
  constructor(private readonly syncRunService: SyncRunService) {}

  @Post()
  @RequirePermissions('SYNC:SYNC:EXECUTE')
  run() {
    return this.syncRunService.runPushAndPull();
  }

  @Get('latest')
  @RequirePermissions('SYNC:SYNC_LOG:READ')
  latest() {
    return this.syncRunService.getLatestRun();
  }
}
