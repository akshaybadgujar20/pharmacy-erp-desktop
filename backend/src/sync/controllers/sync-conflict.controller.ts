import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import { ResolveSyncConflictDto } from '../dto/resolve-sync-conflict.dto';
import { SyncConflictListQueryDto } from '../dto/sync-conflict-list-query.dto';
import { SyncConflictService } from '../services/sync-conflict.service';

@Controller('sync-conflicts')
export class SyncConflictController {
  constructor(private readonly syncConflictService: SyncConflictService) {}

  @Get()
  @RequirePermissions('SYNC:SYNC_CONFLICT:READ')
  list(@Query() query: SyncConflictListQueryDto) {
    return this.syncConflictService.list(query);
  }

  @Get(':id')
  @RequirePermissions('SYNC:SYNC_CONFLICT:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.syncConflictService.getById(id);
  }

  @Post(':id/resolve')
  @RequirePermissions('SYNC:SYNC_CONFLICT:RESOLVE')
  resolve(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: ResolveSyncConflictDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.syncConflictService.resolve(id, dto, user.username);
  }
}
