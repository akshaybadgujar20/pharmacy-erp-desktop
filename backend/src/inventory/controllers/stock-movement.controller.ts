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
import { CreateStockAdjustmentDto } from '../dto/create-stock-adjustment.dto';
import { UpdateStockAdjustmentDto } from '../dto/update-stock-adjustment.dto';

@Controller('stocks/:stockId/movement')
export class StockMovementController {
  constructor() {}

  @Get()
  @RequirePermissions('PARTY:EMPLOYEE:READ')
  list(@Query() query: PaginationQueryDto) {
    return query;
  }

  @Get(':id')
  @RequirePermissions('PARTY:EMPLOYEE:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return id;
  }

  @Post()
  @RequirePermissions('PARTY:EMPLOYEE:CREATE')
  create(@Body() dto: CreateStockAdjustmentDto) {
    return dto;
  }

  @Patch(':id')
  @RequirePermissions('PARTY:EMPLOYEE:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateStockAdjustmentDto,
  ) {
    return dto;
  }

  @Delete(':id')
  @RequirePermissions('PARTY:EMPLOYEE:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return query;
  }
}
