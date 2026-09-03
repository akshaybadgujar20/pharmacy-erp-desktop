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
import { CreateStockTakeItemDto } from '../dto/create-stock-take-item.dto';
import { UpdateStockTakeItemDto } from '../dto/update-stock-take-item.dto';
import { StockTakeItemService } from '../services/stock-take-item.service';

@Controller('stock-takes/:stockTakeId/items')
export class StockTakeItemController {
  constructor(private readonly stockTakeItemService: StockTakeItemService) {}

  @Get()
  @RequirePermissions('INVENTORY:STOCK_TAKE:READ')
  list(
    @Param('stockTakeId', ParseBigIntPipe) stockTakeId: bigint,
    @Query() query: PaginationQueryDto,
  ) {
    return this.stockTakeItemService.list(stockTakeId, query);
  }

  @Get(':id')
  @RequirePermissions('INVENTORY:STOCK_TAKE:READ')
  getById(
    @Param('stockTakeId', ParseBigIntPipe) stockTakeId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
  ) {
    return this.stockTakeItemService.getById(stockTakeId, id);
  }

  @Post()
  @RequirePermissions('INVENTORY:STOCK_TAKE:CREATE')
  create(
    @Param('stockTakeId', ParseBigIntPipe) stockTakeId: bigint,
    @Body() dto: CreateStockTakeItemDto,
  ) {
    return this.stockTakeItemService.create(stockTakeId, dto);
  }

  @Patch(':id')
  @RequirePermissions('INVENTORY:STOCK_TAKE:UPDATE')
  update(
    @Param('stockTakeId', ParseBigIntPipe) stockTakeId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateStockTakeItemDto,
  ) {
    return this.stockTakeItemService.update(stockTakeId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('INVENTORY:STOCK_TAKE:DELETE')
  delete(
    @Param('stockTakeId', ParseBigIntPipe) stockTakeId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.stockTakeItemService.delete(stockTakeId, id, query.version);
  }
}
