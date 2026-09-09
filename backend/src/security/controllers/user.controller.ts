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
import { CreateUserDto } from '../dto/create-user.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserService } from '../services/user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @RequirePermissions('SECURITY:USER:READ')
  list(@Query() query: PaginationQueryDto) {
    return this.userService.list(query);
  }

  @Get(':id')
  @RequirePermissions('SECURITY:USER:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.userService.getById(id);
  }

  @Post()
  @RequirePermissions('SECURITY:USER:CREATE')
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('SECURITY:USER:UPDATE')
  update(@Param('id', ParseBigIntPipe) id: bigint, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('SECURITY:USER:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.userService.delete(id, query.version);
  }

  @Post(':id/reset-password')
  @RequirePermissions('SECURITY:USER:RESET_PASSWORD')
  resetPassword(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.userService.resetPassword(id, dto);
  }

  @Post(':id/unlock')
  @RequirePermissions('SECURITY:USER:UNLOCK')
  unlock(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.userService.unlock(id);
  }
}
