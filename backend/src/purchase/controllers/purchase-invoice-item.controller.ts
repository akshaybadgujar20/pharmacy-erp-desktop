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
import { CreatePurchaseInvoiceItemDto } from '../dto/create-purchase-invoice-item.dto';
import { UpdatePurchaseInvoiceItemDto } from '../dto/update-purchase-invoice-item.dto';
import { PurchaseInvoiceItemService } from '../services/purchase-invoice-item.service';

@Controller('purchase-invoices/:purchaseInvoiceId/items')
export class PurchaseInvoiceItemController {
  constructor(
    private readonly purchaseInvoiceItemService: PurchaseInvoiceItemService,
  ) {}

  @Get()
  @RequirePermissions('PURCHASE:PURCHASE_INVOICE:READ')
  list(
    @Param('purchaseInvoiceId', ParseBigIntPipe) purchaseInvoiceId: bigint,
    @Query() query: PaginationQueryDto,
  ) {
    return this.purchaseInvoiceItemService.list(purchaseInvoiceId, query);
  }

  @Get(':id')
  @RequirePermissions('PURCHASE:PURCHASE_INVOICE:READ')
  getById(
    @Param('purchaseInvoiceId', ParseBigIntPipe) purchaseInvoiceId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
  ) {
    return this.purchaseInvoiceItemService.getById(purchaseInvoiceId, id);
  }

  @Post()
  @RequirePermissions('PURCHASE:PURCHASE_INVOICE:CREATE')
  create(
    @Param('purchaseInvoiceId', ParseBigIntPipe) purchaseInvoiceId: bigint,
    @Body() dto: CreatePurchaseInvoiceItemDto,
  ) {
    return this.purchaseInvoiceItemService.create(purchaseInvoiceId, dto);
  }

  @Patch(':id')
  @RequirePermissions('PURCHASE:PURCHASE_INVOICE:UPDATE')
  update(
    @Param('purchaseInvoiceId', ParseBigIntPipe) purchaseInvoiceId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdatePurchaseInvoiceItemDto,
  ) {
    return this.purchaseInvoiceItemService.update(purchaseInvoiceId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('PURCHASE:PURCHASE_INVOICE:DELETE')
  delete(
    @Param('purchaseInvoiceId', ParseBigIntPipe) purchaseInvoiceId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.purchaseInvoiceItemService.delete(
      purchaseInvoiceId,
      id,
      query.version,
    );
  }
}
