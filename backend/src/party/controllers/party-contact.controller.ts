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
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import { CreatePartyContactDto } from '../dto/create-party-contact.dto';
import { UpdatePartyContactDto } from '../dto/update-party-contact.dto';
import { PartyContactService } from '../services/party-contact.service';

@Controller('parties/:partyId/contacts')
export class PartyContactController {
  constructor(private readonly partyContactService: PartyContactService) {}

  @Get()
  @RequirePermissions('PARTY:PARTY:READ')
  list(
    @Param('partyId', ParseBigIntPipe) partyId: bigint,
    @Query() query: PaginationQueryDto,
  ) {
    return this.partyContactService.list(partyId, query);
  }

  @Get(':id')
  @RequirePermissions('PARTY:PARTY:READ')
  getById(
    @Param('partyId', ParseBigIntPipe) partyId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
  ) {
    return this.partyContactService.getById(partyId, id);
  }

  @Post()
  @RequirePermissions('PARTY:PARTY:CREATE')
  create(
    @Param('partyId', ParseBigIntPipe) partyId: bigint,
    @Body() dto: CreatePartyContactDto,
  ) {
    return this.partyContactService.create(partyId, dto);
  }

  @Patch(':id')
  @RequirePermissions('PARTY:PARTY:UPDATE')
  update(
    @Param('partyId', ParseBigIntPipe) partyId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdatePartyContactDto,
  ) {
    return this.partyContactService.update(partyId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('PARTY:PARTY:DELETE')
  delete(
    @Param('partyId', ParseBigIntPipe) partyId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.partyContactService.delete(partyId, id, query.version);
  }
}
