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
import { CreatePurchaseOrderItemDto } from '../dto/create-purchase-order-item.dto';
import { UpdatePurchaseOrderItemDto } from '../dto/update-purchase-order-item.dto';
import { PurchaseOrderItemService } from '../services/purchase-order-item.service';

@Controller('purchase-orders/:purchaseOrderId/items')
export class PurchaseOrderItemController {
  constructor(
    private readonly purchaseOrderItemService: PurchaseOrderItemService,
  ) {}

  @Get()
  @RequirePermissions('PURCHASE:PURCHASE_ORDER:READ')
  list(
    @Param('purchaseOrderId', ParseBigIntPipe) purchaseOrderId: bigint,
    @Query() query: PaginationQueryDto,
  ) {
    return this.purchaseOrderItemService.list(purchaseOrderId, query);
  }

  @Get(':id')
  @RequirePermissions('PURCHASE:PURCHASE_ORDER:READ')
  getById(
    @Param('purchaseOrderId', ParseBigIntPipe) purchaseOrderId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
  ) {
    return this.purchaseOrderItemService.getById(purchaseOrderId, id);
  }

  @Post()
  @RequirePermissions('PURCHASE:PURCHASE_ORDER:UPDATE')
  create(
    @Param('purchaseOrderId', ParseBigIntPipe) purchaseOrderId: bigint,
    @Body() dto: CreatePurchaseOrderItemDto,
  ) {
    return this.purchaseOrderItemService.create(purchaseOrderId, dto);
  }

  @Patch(':id')
  @RequirePermissions('PURCHASE:PURCHASE_ORDER:UPDATE')
  update(
    @Param('purchaseOrderId', ParseBigIntPipe) purchaseOrderId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdatePurchaseOrderItemDto,
  ) {
    return this.purchaseOrderItemService.update(purchaseOrderId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('PURCHASE:PURCHASE_ORDER:UPDATE')
  delete(
    @Param('purchaseOrderId', ParseBigIntPipe) purchaseOrderId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.purchaseOrderItemService.delete(
      purchaseOrderId,
      id,
      query.version,
    );
  }
}
