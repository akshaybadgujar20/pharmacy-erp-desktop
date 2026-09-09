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
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import { CreatePriceListDto } from '../dto/create-price-list.dto';
import { PriceListListQueryDto } from '../dto/price-list-list-query.dto';
import { UpdatePriceListDto } from '../dto/update-price-list.dto';
import { PriceListService } from '../services/price-list.service';

@Controller('price-lists')
export class PriceListController {
  constructor(private readonly priceListService: PriceListService) {}

  @Get()
  @RequirePermissions('PRICING:PRICE_LIST:READ')
  list(@Query() query: PriceListListQueryDto) {
    return this.priceListService.list(query);
  }

  @Get(':id')
  @RequirePermissions('PRICING:PRICE_LIST:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.priceListService.getById(id);
  }

  @Post()
  @RequirePermissions('PRICING:PRICE_LIST:CREATE')
  create(@Body() dto: CreatePriceListDto) {
    return this.priceListService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('PRICING:PRICE_LIST:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdatePriceListDto,
  ) {
    return this.priceListService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('PRICING:PRICE_LIST:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.priceListService.delete(id, query.version);
  }
}
