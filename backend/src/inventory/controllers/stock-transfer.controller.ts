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
import { CreateStockTransferDto } from '../dto/create-stock-transfer.dto';
import { DispatchStockTransferDto } from '../dto/dispatch-stock-transfer.dto';
import { ReceiveStockTransferDto } from '../dto/receive-stock-transfer.dto';
import { UpdateStockTransferDto } from '../dto/update-stock-transfer.dto';
import { StockTransferService } from '../services/stock-transfer.service';

@Controller('stock-transfers')
export class StockTransferController {
  constructor(private readonly stockTransferService: StockTransferService) {}

  @Get()
  @RequirePermissions('INVENTORY:STOCK_TRANSFER:READ')
  list(@Query() query: PaginationQueryDto) {
    return this.stockTransferService.list(query);
  }

  @Get(':id')
  @RequirePermissions('INVENTORY:STOCK_TRANSFER:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.stockTransferService.getById(id);
  }

  @Post()
  @RequirePermissions('INVENTORY:STOCK_TRANSFER:CREATE')
  create(@Body() dto: CreateStockTransferDto) {
    return this.stockTransferService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('INVENTORY:STOCK_TRANSFER:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateStockTransferDto,
  ) {
    return this.stockTransferService.update(id, dto);
  }

  @Post(':id/dispatch')
  @RequirePermissions('INVENTORY:STOCK_TRANSFER:DISPATCH')
  dispatch(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: DispatchStockTransferDto,
  ) {
    return this.stockTransferService.dispatch(id, dto);
  }

  @Post(':id/receive')
  @RequirePermissions('INVENTORY:STOCK_TRANSFER:RECEIVE')
  receive(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: ReceiveStockTransferDto,
  ) {
    return this.stockTransferService.receive(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('INVENTORY:STOCK_TRANSFER:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.stockTransferService.delete(id, query.version);
  }
}
