import { Controller, Get, Param, Query } from '@nestjs/common';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import { StockListQueryDto } from '../dto/stock-list-query.dto';
import { StockService } from '../services/stock.service';

@Controller('stocks')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  @RequirePermissions('INVENTORY:STOCK:READ')
  list(@Query() query: StockListQueryDto) {
    return this.stockService.list(query);
  }

  @Get(':id')
  @RequirePermissions('INVENTORY:STOCK:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.stockService.getById(id);
  }
}
