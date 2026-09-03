import { Controller, Get, Param, Query } from '@nestjs/common';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import { StockMovementListQueryDto } from '../dto/stock-movement-list-query.dto';
import { StockMovementService } from '../services/stock-movement.service';

@Controller('stock-movements')
export class StockMovementController {
  constructor(private readonly stockMovementService: StockMovementService) {}

  @Get()
  @RequirePermissions('INVENTORY:STOCK_MOVEMENT:READ')
  list(@Query() query: StockMovementListQueryDto) {
    return this.stockMovementService.list(query);
  }

  @Get(':id')
  @RequirePermissions('INVENTORY:STOCK_MOVEMENT:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.stockMovementService.getById(id);
  }
}
