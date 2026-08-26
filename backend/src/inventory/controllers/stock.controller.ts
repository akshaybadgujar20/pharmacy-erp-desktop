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
import { StockService } from '../services/stock.service';
import { CreateStockDto } from '../dto/create-stock.dto';
import { UpdateStockDto } from '../dto/update-stock.dto';

@Controller('stocks')
export class StockController {
  constructor(private readonly doctorService: StockService) {}

  @Get()
  @RequirePermissions('PARTY:DOCTOR:READ')
  list(@Query() query: PaginationQueryDto) {
    return this.doctorService.list(query);
  }

  @Get(':id')
  @RequirePermissions('PARTY:DOCTOR:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.doctorService.getById(id);
  }

  @Post()
  @RequirePermissions('PARTY:DOCTOR:CREATE')
  create(@Body() dto: CreateStockDto) {
    return this.doctorService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('PARTY:DOCTOR:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateStockDto,
  ) {
    return this.doctorService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('PARTY:DOCTOR:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.doctorService.delete(id, query.version);
  }
}
