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
import { BatchService } from '../services/batch.service';
import { CreateBatchDto } from '../dto/create-batch.dto';
import { UpdateBatchDto } from '../dto/update-batch.dto';

@Controller('batches')
export class BatchController {
  constructor(private readonly customerService: BatchService) {}

  @Get()
  @RequirePermissions('PARTY:CUSTOMER:READ')
  list(@Query() query: PaginationQueryDto) {
    return this.customerService.list(query);
  }

  @Get(':id')
  @RequirePermissions('PARTY:CUSTOMER:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.customerService.getById(id);
  }

  @Post()
  @RequirePermissions('PARTY:CUSTOMER:CREATE')
  create(@Body() dto: CreateBatchDto) {
    return this.customerService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('PARTY:CUSTOMER:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateBatchDto,
  ) {
    return this.customerService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('PARTY:CUSTOMER:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.customerService.delete(id, query.version);
  }
}
