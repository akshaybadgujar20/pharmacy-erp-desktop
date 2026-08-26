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
import { CreatePartyRoleDto } from './dto/create-party-role.dto';
import { UpdatePartyRoleDto } from './dto/update-party-role.dto';
import { PartyRoleService } from './party-role.service';

@Controller('parties/:partyId/roles')
export class PartyRoleController {
  constructor(private readonly partyRoleService: PartyRoleService) {}

  @Get()
  @RequirePermissions('PARTY:PARTY:READ')
  list(
    @Param('partyId', ParseBigIntPipe) partyId: bigint,
    @Query() query: PaginationQueryDto,
  ) {
    return this.partyRoleService.list(partyId, query);
  }

  @Get(':id')
  @RequirePermissions('PARTY:PARTY:READ')
  getById(
    @Param('partyId', ParseBigIntPipe) partyId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
  ) {
    return this.partyRoleService.getById(partyId, id);
  }

  @Post()
  @RequirePermissions('PARTY:PARTY:CREATE')
  create(
    @Param('partyId', ParseBigIntPipe) partyId: bigint,
    @Body() dto: CreatePartyRoleDto,
  ) {
    return this.partyRoleService.create(partyId, dto);
  }

  @Patch(':id')
  @RequirePermissions('PARTY:PARTY:UPDATE')
  update(
    @Param('partyId', ParseBigIntPipe) partyId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdatePartyRoleDto,
  ) {
    return this.partyRoleService.update(partyId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('PARTY:PARTY:DELETE')
  delete(
    @Param('partyId', ParseBigIntPipe) partyId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.partyRoleService.delete(partyId, id, query.version);
  }
}
