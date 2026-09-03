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
import { CreateStockTakeDto } from '../dto/create-stock-take.dto';
import { ReconcileStockTakeDto } from '../dto/reconcile-stock-take.dto';
import { UpdateStockTakeDto } from '../dto/update-stock-take.dto';
import { StockTakeService } from '../services/stock-take.service';

@Controller('stock-takes')
export class StockTakeController {
  constructor(private readonly stockTakeService: StockTakeService) {}

  @Get()
  @RequirePermissions('INVENTORY:STOCK_TAKE:READ')
  list(@Query() query: PaginationQueryDto) {
    return this.stockTakeService.list(query);
  }

  @Get(':id')
  @RequirePermissions('INVENTORY:STOCK_TAKE:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.stockTakeService.getById(id);
  }

  @Post()
  @RequirePermissions('INVENTORY:STOCK_TAKE:CREATE')
  create(@Body() dto: CreateStockTakeDto) {
    return this.stockTakeService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('INVENTORY:STOCK_TAKE:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateStockTakeDto,
  ) {
    return this.stockTakeService.update(id, dto);
  }

  @Post(':id/start')
  @RequirePermissions('INVENTORY:STOCK_TAKE:UPDATE')
  start(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.stockTakeService.start(id);
  }

  @Post(':id/complete')
  @RequirePermissions('INVENTORY:STOCK_TAKE:UPDATE')
  complete(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.stockTakeService.complete(id);
  }

  @Post(':id/reconcile')
  @RequirePermissions('INVENTORY:STOCK_TAKE:RECONCILE')
  reconcile(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: ReconcileStockTakeDto,
  ) {
    return this.stockTakeService.reconcile(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('INVENTORY:STOCK_TAKE:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.stockTakeService.delete(id, query.version);
  }
}
