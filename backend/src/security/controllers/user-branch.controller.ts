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
import { CreateUserBranchDto } from '../dto/create-user-branch.dto';
import { UpdateUserBranchDto } from '../dto/update-user-branch.dto';
import { UserBranchService } from '../services/user-branch.service';

@Controller('users/:userId/branches')
export class UserBranchController {
  constructor(private readonly userBranchService: UserBranchService) {}

  @Get()
  @RequirePermissions('SECURITY:USER_BRANCH:READ')
  list(
    @Param('userId', ParseBigIntPipe) userId: bigint,
    @Query() query: PaginationQueryDto,
  ) {
    return this.userBranchService.list(userId, query);
  }

  @Get(':id')
  @RequirePermissions('SECURITY:USER_BRANCH:READ')
  getById(
    @Param('userId', ParseBigIntPipe) userId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
  ) {
    return this.userBranchService.getById(userId, id);
  }

  @Post()
  @RequirePermissions('SECURITY:USER_BRANCH:CREATE')
  create(
    @Param('userId', ParseBigIntPipe) userId: bigint,
    @Body() dto: CreateUserBranchDto,
  ) {
    return this.userBranchService.create(userId, dto);
  }

  @Patch(':id')
  @RequirePermissions('SECURITY:USER_BRANCH:UPDATE')
  update(
    @Param('userId', ParseBigIntPipe) userId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateUserBranchDto,
  ) {
    return this.userBranchService.update(userId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('SECURITY:USER_BRANCH:DELETE')
  delete(
    @Param('userId', ParseBigIntPipe) userId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.userBranchService.delete(userId, id, query.version);
  }
}
