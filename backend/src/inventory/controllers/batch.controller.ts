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
import { BatchListQueryDto } from '../dto/batch-list-query.dto';
import { CreateBatchDto } from '../dto/create-batch.dto';
import { UpdateBatchDto } from '../dto/update-batch.dto';
import { BatchService } from '../services/batch.service';

@Controller('batches')
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  @Get()
  @RequirePermissions('INVENTORY:BATCH:READ')
  list(@Query() query: BatchListQueryDto) {
    return this.batchService.list(query);
  }

  @Get(':id')
  @RequirePermissions('INVENTORY:BATCH:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.batchService.getById(id);
  }

  @Post()
  @RequirePermissions('INVENTORY:BATCH:CREATE')
  create(@Body() dto: CreateBatchDto) {
    return this.batchService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('INVENTORY:BATCH:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateBatchDto,
  ) {
    return this.batchService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('INVENTORY:BATCH:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.batchService.delete(id, query.version);
  }
}
