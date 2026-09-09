import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { DeleteEntityQueryDto } from '../../common/dto/delete-entity-query.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import {
  CreatePriceListItemDto,
  UpdatePriceListItemDto,
} from '../dto/create-price-list-item.dto';
import { ReplacePriceListItemsDto } from '../dto/replace-price-list-items.dto';
import { PriceListItemService } from '../services/price-list-item.service';

@Controller('price-lists/:priceListId/items')
export class PriceListItemController {
  constructor(private readonly priceListItemService: PriceListItemService) {}

  @Get()
  @RequirePermissions('PRICING:PRICE_LIST_ITEM:READ')
  list(
    @Param('priceListId', ParseBigIntPipe) priceListId: bigint,
    @Query() query: PaginationQueryDto,
  ) {
    return this.priceListItemService.list(priceListId, query);
  }

  @Put('replace')
  @RequirePermissions('PRICING:PRICE_LIST_ITEM:REPLACE')
  replace(
    @Param('priceListId', ParseBigIntPipe) priceListId: bigint,
    @Body() dto: ReplacePriceListItemsDto,
  ) {
    return this.priceListItemService.replace(priceListId, dto);
  }

  @Get(':id')
  @RequirePermissions('PRICING:PRICE_LIST_ITEM:READ')
  getById(
    @Param('priceListId', ParseBigIntPipe) priceListId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
  ) {
    return this.priceListItemService.getById(priceListId, id);
  }

  @Post()
  @RequirePermissions('PRICING:PRICE_LIST_ITEM:CREATE')
  create(
    @Param('priceListId', ParseBigIntPipe) priceListId: bigint,
    @Body() dto: CreatePriceListItemDto,
  ) {
    return this.priceListItemService.create(priceListId, dto);
  }

  @Patch(':id')
  @RequirePermissions('PRICING:PRICE_LIST_ITEM:UPDATE')
  update(
    @Param('priceListId', ParseBigIntPipe) priceListId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdatePriceListItemDto,
  ) {
    return this.priceListItemService.update(priceListId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('PRICING:PRICE_LIST_ITEM:DELETE')
  delete(
    @Param('priceListId', ParseBigIntPipe) priceListId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.priceListItemService.delete(priceListId, id, query.version);
  }
}
