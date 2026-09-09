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
import { CreateUserRoleDto } from '../dto/create-user-role.dto';
import { ReplaceUserRolesDto } from '../dto/replace-user-roles.dto';
import { UpdateUserRoleDto } from '../dto/update-user-role.dto';
import { UserRoleService } from '../services/user-role.service';

@Controller('users/:userId/roles')
export class UserRoleController {
  constructor(private readonly userRoleService: UserRoleService) {}

  @Get()
  @RequirePermissions('SECURITY:USER_ROLE:READ')
  list(
    @Param('userId', ParseBigIntPipe) userId: bigint,
    @Query() query: PaginationQueryDto,
  ) {
    return this.userRoleService.list(userId, query);
  }

  @Get(':id')
  @RequirePermissions('SECURITY:USER_ROLE:READ')
  getById(
    @Param('userId', ParseBigIntPipe) userId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
  ) {
    return this.userRoleService.getById(userId, id);
  }

  @Post()
  @RequirePermissions('SECURITY:USER_ROLE:CREATE')
  create(
    @Param('userId', ParseBigIntPipe) userId: bigint,
    @Body() dto: CreateUserRoleDto,
  ) {
    return this.userRoleService.create(userId, dto);
  }

  @Patch(':id')
  @RequirePermissions('SECURITY:USER_ROLE:UPDATE')
  update(
    @Param('userId', ParseBigIntPipe) userId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.userRoleService.update(userId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('SECURITY:USER_ROLE:DELETE')
  delete(
    @Param('userId', ParseBigIntPipe) userId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.userRoleService.delete(userId, id, query.version);
  }

  @Put('replace')
  @RequirePermissions('SECURITY:USER_ROLE:REPLACE')
  replace(
    @Param('userId', ParseBigIntPipe) userId: bigint,
    @Body() dto: ReplaceUserRolesDto,
  ) {
    return this.userRoleService.replace(userId, dto);
  }
}
