import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { DeleteEntityQueryDto } from '../../common/dto/delete-entity-query.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import { CreateRolePermissionDto } from '../dto/create-role-permission.dto';
import { ReplaceRolePermissionsDto } from '../dto/replace-role-permissions.dto';
import { UpdateRolePermissionDto } from '../dto/update-role-permission.dto';
import { RolePermissionService } from '../services/role-permission.service';

@Controller('roles/:roleId/permissions')
export class RolePermissionController {
  constructor(private readonly rolePermissionService: RolePermissionService) {}

  @Get()
  @RequirePermissions('SECURITY:ROLE_PERMISSION:READ')
  list(
    @Param('roleId', ParseBigIntPipe) roleId: bigint,
    @Query() query: PaginationQueryDto,
  ) {
    return this.rolePermissionService.list(roleId, query);
  }

  @Get(':id')
  @RequirePermissions('SECURITY:ROLE_PERMISSION:READ')
  getById(
    @Param('roleId', ParseBigIntPipe) roleId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
  ) {
    return this.rolePermissionService.getById(roleId, id);
  }

  @Post()
  @RequirePermissions('SECURITY:ROLE_PERMISSION:CREATE')
  create(
    @Param('roleId', ParseBigIntPipe) roleId: bigint,
    @Body() dto: CreateRolePermissionDto,
  ) {
    return this.rolePermissionService.create(roleId, dto);
  }

  @Patch(':id')
  @RequirePermissions('SECURITY:ROLE_PERMISSION:UPDATE')
  update(
    @Param('roleId', ParseBigIntPipe) roleId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateRolePermissionDto,
  ) {
    return this.rolePermissionService.update(roleId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('SECURITY:ROLE_PERMISSION:DELETE')
  delete(
    @Param('roleId', ParseBigIntPipe) roleId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.rolePermissionService.delete(roleId, id, query.version);
  }

  @Put('replace')
  @RequirePermissions('SECURITY:ROLE_PERMISSION:REPLACE')
  replace(
    @Param('roleId', ParseBigIntPipe) roleId: bigint,
    @Body() dto: ReplaceRolePermissionsDto,
  ) {
    return this.rolePermissionService.replace(roleId, dto);
  }
}
