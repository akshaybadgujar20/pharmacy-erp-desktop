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
import { CreateGoodsReceiptDto } from '../dto/create-goods-receipt.dto';
import { PurchaseWorkflowDto } from '../dto/purchase-workflow.dto';
import { UpdateGoodsReceiptDto } from '../dto/update-goods-receipt.dto';
import { GoodsReceiptService } from '../services/goods-receipt.service';

@Controller('goods-receipts')
export class GoodsReceiptController {
  constructor(private readonly goodsReceiptService: GoodsReceiptService) {}

  @Get()
  @RequirePermissions('PURCHASE:GOODS_RECEIPT:READ')
  list(@Query() query: PaginationQueryDto) {
    return this.goodsReceiptService.list(query);
  }

  @Get(':id')
  @RequirePermissions('PURCHASE:GOODS_RECEIPT:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.goodsReceiptService.getById(id);
  }

  @Post()
  @RequirePermissions('PURCHASE:GOODS_RECEIPT:CREATE')
  create(@Body() dto: CreateGoodsReceiptDto) {
    return this.goodsReceiptService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('PURCHASE:GOODS_RECEIPT:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateGoodsReceiptDto,
  ) {
    return this.goodsReceiptService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('PURCHASE:GOODS_RECEIPT:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.goodsReceiptService.delete(id, query.version);
  }

  @Post(':id/submit-inspection')
  @RequirePermissions('PURCHASE:GOODS_RECEIPT:SUBMIT')
  submitInspection(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: PurchaseWorkflowDto,
  ) {
    return this.goodsReceiptService.submitInspection(id, dto);
  }

  @Post(':id/accept')
  @RequirePermissions('PURCHASE:GOODS_RECEIPT:ACCEPT')
  accept(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: PurchaseWorkflowDto,
  ) {
    return this.goodsReceiptService.accept(id, dto);
  }

  @Post(':id/reject')
  @RequirePermissions('PURCHASE:GOODS_RECEIPT:REJECT')
  reject(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: PurchaseWorkflowDto,
  ) {
    return this.goodsReceiptService.reject(id, dto);
  }

  @Post(':id/cancel')
  @RequirePermissions('PURCHASE:GOODS_RECEIPT:CANCEL')
  cancel(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: PurchaseWorkflowDto,
  ) {
    return this.goodsReceiptService.cancel(id, dto);
  }
}
