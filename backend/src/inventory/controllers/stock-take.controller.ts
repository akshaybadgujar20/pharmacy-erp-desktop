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
import { SupplierService } from '../services/supplier.service';

@Controller('stocks/:stockId/take')
export class StockTakeController {
  constructor(private readonly supplierService: SupplierService) {}

  @Get()
  @RequirePermissions('PARTY:SUPPLIER:READ')
  list(@Query() query: PaginationQueryDto) {
    return this.supplierService.list(query);
  }

  @Get(':id')
  @RequirePermissions('PARTY:SUPPLIER:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.supplierService.getById(id);
  }

  @Post()
  @RequirePermissions('PARTY:SUPPLIER:CREATE')
  create(@Body() dto: CreateStockTake) {
    return this.supplierService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('PARTY:SUPPLIER:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateStockTakeDto,
  ) {
    return this.supplierService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('PARTY:SUPPLIER:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.supplierService.delete(id, query.version);
  }
}
