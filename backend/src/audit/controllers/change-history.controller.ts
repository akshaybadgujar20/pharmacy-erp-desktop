import { Controller, Get, Param, Query } from '@nestjs/common';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import { ChangeHistoryListQueryDto } from '../dto/change-history-list-query.dto';
import { ChangeHistoryService } from '../services/change-history.service';

@Controller('change-histories')
export class ChangeHistoryController {
  constructor(private readonly changeHistoryService: ChangeHistoryService) {}

  @Get()
  @RequirePermissions('AUDIT:CHANGE_HISTORY:READ')
  list(@Query() query: ChangeHistoryListQueryDto) {
    return this.changeHistoryService.list(query);
  }

  @Get(':id')
  @RequirePermissions('AUDIT:CHANGE_HISTORY:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.changeHistoryService.getById(id);
  }
}
