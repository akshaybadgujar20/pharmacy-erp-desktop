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
import { CreatePurchaseReturnItemDto } from '../dto/create-purchase-return-item.dto';
import { UpdatePurchaseReturnItemDto } from '../dto/update-purchase-return-item.dto';
import { PurchaseReturnItemService } from '../services/purchase-return-item.service';

@Controller('purchase-returns/:purchaseReturnId/items')
export class PurchaseReturnItemController {
  constructor(
    private readonly purchaseReturnItemService: PurchaseReturnItemService,
  ) {}

  @Get()
  @RequirePermissions('PURCHASE:PURCHASE_RETURN:READ')
  list(
    @Param('purchaseReturnId', ParseBigIntPipe) purchaseReturnId: bigint,
    @Query() query: PaginationQueryDto,
  ) {
    return this.purchaseReturnItemService.list(purchaseReturnId, query);
  }

  @Get(':id')
  @RequirePermissions('PURCHASE:PURCHASE_RETURN:READ')
  getById(
    @Param('purchaseReturnId', ParseBigIntPipe) purchaseReturnId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
  ) {
    return this.purchaseReturnItemService.getById(purchaseReturnId, id);
  }

  @Post()
  @RequirePermissions('PURCHASE:PURCHASE_RETURN:CREATE')
  create(
    @Param('purchaseReturnId', ParseBigIntPipe) purchaseReturnId: bigint,
    @Body() dto: CreatePurchaseReturnItemDto,
  ) {
    return this.purchaseReturnItemService.create(purchaseReturnId, dto);
  }

  @Patch(':id')
  @RequirePermissions('PURCHASE:PURCHASE_RETURN:UPDATE')
  update(
    @Param('purchaseReturnId', ParseBigIntPipe) purchaseReturnId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdatePurchaseReturnItemDto,
  ) {
    return this.purchaseReturnItemService.update(purchaseReturnId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('PURCHASE:PURCHASE_RETURN:DELETE')
  delete(
    @Param('purchaseReturnId', ParseBigIntPipe) purchaseReturnId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.purchaseReturnItemService.delete(
      purchaseReturnId,
      id,
      query.version,
    );
  }
}
