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
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { RoleService } from '../services/role.service';

@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @RequirePermissions('SECURITY:ROLE:READ')
  list(@Query() query: PaginationQueryDto) {
    return this.roleService.list(query);
  }

  @Get(':id')
  @RequirePermissions('SECURITY:ROLE:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.roleService.getById(id);
  }

  @Post()
  @RequirePermissions('SECURITY:ROLE:CREATE')
  create(@Body() dto: CreateRoleDto) {
    return this.roleService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('SECURITY:ROLE:UPDATE')
  update(@Param('id', ParseBigIntPipe) id: bigint, @Body() dto: UpdateRoleDto) {
    return this.roleService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('SECURITY:ROLE:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.roleService.delete(id, query.version);
  }
}
