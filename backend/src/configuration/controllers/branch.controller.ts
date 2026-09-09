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
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import { CreateBranchDto } from '../dto/create-branch.dto';
import { BranchListQueryDto } from '../dto/branch-list-query.dto';
import { UpdateBranchDto } from '../dto/update-branch.dto';
import { BranchService } from '../services/branch.service';

@Controller('branches')
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Get()
  @RequirePermissions('CONFIGURATION:BRANCH:READ')
  list(@Query() query: BranchListQueryDto) {
    return this.branchService.list(query);
  }

  @Get(':id')
  @RequirePermissions('CONFIGURATION:BRANCH:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.branchService.getById(id);
  }

  @Post()
  @RequirePermissions('CONFIGURATION:BRANCH:CREATE')
  create(@Body() dto: CreateBranchDto) {
    return this.branchService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('CONFIGURATION:BRANCH:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.branchService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('CONFIGURATION:BRANCH:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.branchService.delete(id, query.version);
  }
}
