import { Controller, Get, Param, Query } from '@nestjs/common';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import { LedgerEntryListQueryDto } from '../dto/ledger-entry-list-query.dto';
import { LedgerEntryService } from '../services/ledger-entry.service';

@Controller('ledger-entries')
export class LedgerEntryController {
  constructor(private readonly ledgerEntryService: LedgerEntryService) {}

  @Get()
  @RequirePermissions('FINANCE:LEDGER_ENTRY:READ')
  list(@Query() query: LedgerEntryListQueryDto) {
    return this.ledgerEntryService.list(query);
  }

  @Get(':id')
  @RequirePermissions('FINANCE:LEDGER_ENTRY:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.ledgerEntryService.getById(id);
  }
}
