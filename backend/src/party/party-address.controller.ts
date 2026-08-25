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
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { ParseBigIntPipe } from '../common/pipes/parse-bigint.pipe';
import { CreatePartyAddressDto } from './dto/create-party-address.dto';
import { UpdatePartyAddressDto } from './dto/update-party-address.dto';
import { PartyAddressService } from './party-address.service';

@Controller('parties/:partyId/addresses')
export class PartyAddressController {
  constructor(private readonly partyAddressService: PartyAddressService) {}

  @Get()
  @RequirePermissions('PARTY:PARTY:READ')
  list(
    @Param('partyId', ParseBigIntPipe) partyId: bigint,
    @Query() query: PaginationQueryDto,
  ) {
    return this.partyAddressService.list(partyId, query);
  }

  @Get(':id')
  @RequirePermissions('PARTY:PARTY:READ')
  getById(
    @Param('partyId', ParseBigIntPipe) partyId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
  ) {
    return this.partyAddressService.getById(partyId, id);
  }

  @Post()
  @RequirePermissions('PARTY:PARTY:CREATE')
  create(
    @Param('partyId', ParseBigIntPipe) partyId: bigint,
    @Body() dto: CreatePartyAddressDto,
  ) {
    return this.partyAddressService.create(partyId, dto);
  }

  @Patch(':id')
  @RequirePermissions('PARTY:PARTY:UPDATE')
  update(
    @Param('partyId', ParseBigIntPipe) partyId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdatePartyAddressDto,
  ) {
    return this.partyAddressService.update(partyId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('PARTY:PARTY:DELETE')
  delete(
    @Param('partyId', ParseBigIntPipe) partyId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query('version') version: string,
  ) {
    return this.partyAddressService.delete(partyId, id, Number(version));
  }
}
