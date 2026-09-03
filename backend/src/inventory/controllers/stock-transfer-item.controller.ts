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
import { CreateStockTransferItemDto } from '../dto/create-stock-transfer-item.dto';
import { UpdateStockTransferItemDto } from '../dto/update-stock-transfer-item.dto';
import { StockTransferItemService } from '../services/stock-transfer-item.service';

@Controller('stock-transfers/:transferId/items')
export class StockTransferItemController {
  constructor(
    private readonly stockTransferItemService: StockTransferItemService,
  ) {}

  @Get()
  @RequirePermissions('INVENTORY:STOCK_TRANSFER:READ')
  list(
    @Param('transferId', ParseBigIntPipe) transferId: bigint,
    @Query() query: PaginationQueryDto,
  ) {
    return this.stockTransferItemService.list(transferId, query);
  }

  @Get(':id')
  @RequirePermissions('INVENTORY:STOCK_TRANSFER:READ')
  getById(
    @Param('transferId', ParseBigIntPipe) transferId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
  ) {
    return this.stockTransferItemService.getById(transferId, id);
  }

  @Post()
  @RequirePermissions('INVENTORY:STOCK_TRANSFER:CREATE')
  create(
    @Param('transferId', ParseBigIntPipe) transferId: bigint,
    @Body() dto: CreateStockTransferItemDto,
  ) {
    return this.stockTransferItemService.create(transferId, dto);
  }

  @Patch(':id')
  @RequirePermissions('INVENTORY:STOCK_TRANSFER:UPDATE')
  update(
    @Param('transferId', ParseBigIntPipe) transferId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateStockTransferItemDto,
  ) {
    return this.stockTransferItemService.update(transferId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('INVENTORY:STOCK_TRANSFER:DELETE')
  delete(
    @Param('transferId', ParseBigIntPipe) transferId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.stockTransferItemService.delete(transferId, id, query.version);
  }
}
