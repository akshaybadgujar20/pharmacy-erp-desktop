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
import { CreateStockTake } from '../dto/create-stock-take';
import { UpdateStockTakeDto } from '../dto/update-stock-take.dto';

@Controller('stocks/:stockId/take')
export class StockTakeController {
  constructor() {}

  @Get()
  @RequirePermissions('PARTY:SUPPLIER:READ')
  list(@Query() query: PaginationQueryDto) {
    return query;
  }

  @Get(':id')
  @RequirePermissions('PARTY:SUPPLIER:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return id;
  }

  @Post()
  @RequirePermissions('PARTY:SUPPLIER:CREATE')
  create(@Body() dto: CreateStockTake) {
    return dto;
  }

  @Patch(':id')
  @RequirePermissions('PARTY:SUPPLIER:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateStockTakeDto,
  ) {
    return dto;
  }

  @Delete(':id')
  @RequirePermissions('PARTY:SUPPLIER:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return query;
  }
}
