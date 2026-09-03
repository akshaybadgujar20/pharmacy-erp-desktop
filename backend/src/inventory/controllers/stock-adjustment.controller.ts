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
import { ApproveStockAdjustmentDto } from '../dto/approve-stock-adjustment.dto';
import { CreateStockAdjustmentDto } from '../dto/create-stock-adjustment.dto';
import { UpdateStockAdjustmentDto } from '../dto/update-stock-adjustment.dto';
import { StockAdjustmentService } from '../services/stock-adjustment.service';

@Controller('stock-adjustments')
export class StockAdjustmentController {
  constructor(
    private readonly stockAdjustmentService: StockAdjustmentService,
  ) {}

  @Get()
  @RequirePermissions('INVENTORY:STOCK_ADJUSTMENT:READ')
  list(@Query() query: PaginationQueryDto) {
    return this.stockAdjustmentService.list(query);
  }

  @Get(':id')
  @RequirePermissions('INVENTORY:STOCK_ADJUSTMENT:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.stockAdjustmentService.getById(id);
  }

  @Post()
  @RequirePermissions('INVENTORY:STOCK_ADJUSTMENT:CREATE')
  create(@Body() dto: CreateStockAdjustmentDto) {
    return this.stockAdjustmentService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('INVENTORY:STOCK_ADJUSTMENT:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateStockAdjustmentDto,
  ) {
    return this.stockAdjustmentService.update(id, dto);
  }

  @Post(':id/approve')
  @RequirePermissions('INVENTORY:STOCK_ADJUSTMENT:APPROVE')
  approve(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: ApproveStockAdjustmentDto,
  ) {
    return this.stockAdjustmentService.approve(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('INVENTORY:STOCK_ADJUSTMENT:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.stockAdjustmentService.delete(id, query.version);
  }
}
