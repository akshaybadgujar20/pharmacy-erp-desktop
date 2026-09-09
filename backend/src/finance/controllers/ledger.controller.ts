import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { DeleteEntityQueryDto } from '../../common/dto/delete-entity-query.dto';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import { CreateLedgerDto } from '../dto/create-ledger.dto';
import { LedgerListQueryDto } from '../dto/ledger-list-query.dto';
import { UpdateLedgerDto } from '../dto/update-ledger.dto';
import { LedgerService } from '../services/ledger.service';

@Controller('ledgers')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get()
  @RequirePermissions('FINANCE:LEDGER:READ')
  list(@Query() query: LedgerListQueryDto) {
    return this.ledgerService.list(query);
  }

  @Get(':id')
  @RequirePermissions('FINANCE:LEDGER:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.ledgerService.getById(id);
  }

  @Post()
  @RequirePermissions('FINANCE:LEDGER:CREATE')
  create(@Body() dto: CreateLedgerDto) {
    return this.ledgerService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('FINANCE:LEDGER:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateLedgerDto,
  ) {
    return this.ledgerService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('FINANCE:LEDGER:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.ledgerService.delete(id, query.version);
  }
}
