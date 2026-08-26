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
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { DeleteEntityQueryDto } from '../common/dto/delete-entity-query.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { ParseBigIntPipe } from '../common/pipes/parse-bigint.pipe';
import { CreatePartyDto } from './dto/create-party.dto';
import { UpdatePartyDto } from './dto/update-party.dto';
import { PartyService } from './party.service';

@Controller('parties')
export class PartyController {
  constructor(private readonly partyService: PartyService) {}

  @Get()
  @RequirePermissions('PARTY:PARTY:READ')
  list(@Query() query: PaginationQueryDto) {
    return this.partyService.list(query);
  }

  @Get(':id')
  @RequirePermissions('PARTY:PARTY:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.partyService.getById(id);
  }

  @Post()
  @RequirePermissions('PARTY:PARTY:CREATE')
  create(@Body() dto: CreatePartyDto) {
    return this.partyService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('PARTY:PARTY:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdatePartyDto,
  ) {
    return this.partyService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('PARTY:PARTY:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.partyService.delete(id, query.version);
  }
}
