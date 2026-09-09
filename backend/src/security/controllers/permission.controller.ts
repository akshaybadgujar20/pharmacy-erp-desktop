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
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { PermissionService } from '../services/permission.service';

@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  @RequirePermissions('SECURITY:PERMISSION:READ')
  list(@Query() query: PaginationQueryDto) {
    return this.permissionService.list(query);
  }

  @Get(':id')
  @RequirePermissions('SECURITY:PERMISSION:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.permissionService.getById(id);
  }

  @Post()
  @RequirePermissions('SECURITY:PERMISSION:CREATE')
  create(@Body() dto: CreatePermissionDto) {
    return this.permissionService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('SECURITY:PERMISSION:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdatePermissionDto,
  ) {
    return this.permissionService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('SECURITY:PERMISSION:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.permissionService.delete(id, query.version);
  }
}
