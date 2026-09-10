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
import { CreateGoodsReceiptItemDto } from '../dto/create-goods-receipt-item.dto';
import { UpdateGoodsReceiptItemDto } from '../dto/update-goods-receipt-item.dto';
import { GoodsReceiptItemService } from '../services/goods-receipt-item.service';

@Controller('goods-receipts/:goodsReceiptId/items')
export class GoodsReceiptItemController {
  constructor(
    private readonly goodsReceiptItemService: GoodsReceiptItemService,
  ) {}

  @Get()
  @RequirePermissions('PURCHASE:GOODS_RECEIPT:READ')
  list(
    @Param('goodsReceiptId', ParseBigIntPipe) goodsReceiptId: bigint,
    @Query() query: PaginationQueryDto,
  ) {
    return this.goodsReceiptItemService.list(goodsReceiptId, query);
  }

  @Get(':id')
  @RequirePermissions('PURCHASE:GOODS_RECEIPT:READ')
  getById(
    @Param('goodsReceiptId', ParseBigIntPipe) goodsReceiptId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
  ) {
    return this.goodsReceiptItemService.getById(goodsReceiptId, id);
  }

  @Post()
  @RequirePermissions('PURCHASE:GOODS_RECEIPT:CREATE')
  create(
    @Param('goodsReceiptId', ParseBigIntPipe) goodsReceiptId: bigint,
    @Body() dto: CreateGoodsReceiptItemDto,
  ) {
    return this.goodsReceiptItemService.create(goodsReceiptId, dto);
  }

  @Patch(':id')
  @RequirePermissions('PURCHASE:GOODS_RECEIPT:UPDATE')
  update(
    @Param('goodsReceiptId', ParseBigIntPipe) goodsReceiptId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateGoodsReceiptItemDto,
  ) {
    return this.goodsReceiptItemService.update(goodsReceiptId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('PURCHASE:GOODS_RECEIPT:DELETE')
  delete(
    @Param('goodsReceiptId', ParseBigIntPipe) goodsReceiptId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.goodsReceiptItemService.delete(
      goodsReceiptId,
      id,
      query.version,
    );
  }
}
