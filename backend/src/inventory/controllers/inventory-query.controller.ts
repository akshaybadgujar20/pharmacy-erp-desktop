import { Controller, Get, Query } from '@nestjs/common';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { FefoPreviewQueryDto } from '../dto/fefo-preview-query.dto';
import { StockService } from '../services/stock.service';

@Controller('inventory')
export class InventoryQueryController {
  constructor(private readonly stockService: StockService) {}

  @Get('fefo-preview')
  @RequirePermissions('INVENTORY:STOCK:READ')
  fefoPreview(@Query() query: FefoPreviewQueryDto) {
    return this.stockService.getFefoPreview(
      BigInt(query.medicineId),
      query.branchId ? BigInt(query.branchId) : undefined,
    );
  }
}
