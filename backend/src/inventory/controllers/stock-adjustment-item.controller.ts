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
import { CreateStockAdjustmentItemDto } from '../dto/create-stock-adjustment-item.dto';
import { UpdateStockAdjustmentItemDto } from '../dto/update-stock-adjustment-item.dto';
import { StockAdjustmentItemService } from '../services/stock-adjustment-item.service';

@Controller('stock-adjustments/:adjustmentId/items')
export class StockAdjustmentItemController {
  constructor(
    private readonly stockAdjustmentItemService: StockAdjustmentItemService,
  ) {}

  @Get()
  @RequirePermissions('INVENTORY:STOCK_ADJUSTMENT:READ')
  list(
    @Param('adjustmentId', ParseBigIntPipe) adjustmentId: bigint,
    @Query() query: PaginationQueryDto,
  ) {
    return this.stockAdjustmentItemService.list(adjustmentId, query);
  }

  @Get(':id')
  @RequirePermissions('INVENTORY:STOCK_ADJUSTMENT:READ')
  getById(
    @Param('adjustmentId', ParseBigIntPipe) adjustmentId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
  ) {
    return this.stockAdjustmentItemService.getById(adjustmentId, id);
  }

  @Post()
  @RequirePermissions('INVENTORY:STOCK_ADJUSTMENT:CREATE')
  create(
    @Param('adjustmentId', ParseBigIntPipe) adjustmentId: bigint,
    @Body() dto: CreateStockAdjustmentItemDto,
  ) {
    return this.stockAdjustmentItemService.create(adjustmentId, dto);
  }

  @Patch(':id')
  @RequirePermissions('INVENTORY:STOCK_ADJUSTMENT:UPDATE')
  update(
    @Param('adjustmentId', ParseBigIntPipe) adjustmentId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateStockAdjustmentItemDto,
  ) {
    return this.stockAdjustmentItemService.update(adjustmentId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('INVENTORY:STOCK_ADJUSTMENT:DELETE')
  delete(
    @Param('adjustmentId', ParseBigIntPipe) adjustmentId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.stockAdjustmentItemService.delete(
      adjustmentId,
      id,
      query.version,
    );
  }
}
