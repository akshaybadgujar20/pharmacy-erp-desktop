import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import { OutboxListQueryDto } from '../dto/outbox-list-query.dto';
import { RetryOutboxDto } from '../dto/retry-outbox.dto';
import { OutboxService } from '../services/outbox.service';

@Controller('outbox')
export class OutboxController {
  constructor(private readonly outboxService: OutboxService) {}

  @Get()
  @RequirePermissions('SYNC:OUTBOX:READ')
  list(@Query() query: OutboxListQueryDto) {
    return this.outboxService.list(query);
  }

  @Get(':id')
  @RequirePermissions('SYNC:OUTBOX:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.outboxService.getById(id);
  }

  @Post(':id/retry')
  @RequirePermissions('SYNC:OUTBOX:RETRY')
  retry(@Param('id', ParseBigIntPipe) id: bigint, @Body() dto: RetryOutboxDto) {
    return this.outboxService.retry(id, dto);
  }
}
