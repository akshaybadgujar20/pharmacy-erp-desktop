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
import { CreateSalesInvoiceItemDto } from '../dto/create-sales-invoice-item.dto';
import { UpdateSalesInvoiceItemDto } from '../dto/update-sales-invoice-item.dto';
import { SalesInvoiceItemService } from '../services/sales-invoice-item.service';

@Controller('sales-invoices/:salesInvoiceId/items')
export class SalesInvoiceItemController {
  constructor(
    private readonly salesInvoiceItemService: SalesInvoiceItemService,
  ) {}

  @Get()
  @RequirePermissions('SALES:SALES_INVOICE:READ')
  list(
    @Param('salesInvoiceId', ParseBigIntPipe) salesInvoiceId: bigint,
    @Query() query: PaginationQueryDto,
  ) {
    return this.salesInvoiceItemService.list(salesInvoiceId, query);
  }

  @Get(':id')
  @RequirePermissions('SALES:SALES_INVOICE:READ')
  getById(
    @Param('salesInvoiceId', ParseBigIntPipe) salesInvoiceId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
  ) {
    return this.salesInvoiceItemService.getById(salesInvoiceId, id);
  }

  @Post()
  @RequirePermissions('SALES:SALES_INVOICE:UPDATE')
  create(
    @Param('salesInvoiceId', ParseBigIntPipe) salesInvoiceId: bigint,
    @Body() dto: CreateSalesInvoiceItemDto,
  ) {
    return this.salesInvoiceItemService.create(salesInvoiceId, dto);
  }

  @Patch(':id')
  @RequirePermissions('SALES:SALES_INVOICE:UPDATE')
  update(
    @Param('salesInvoiceId', ParseBigIntPipe) salesInvoiceId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateSalesInvoiceItemDto,
  ) {
    return this.salesInvoiceItemService.update(salesInvoiceId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('SALES:SALES_INVOICE:UPDATE')
  delete(
    @Param('salesInvoiceId', ParseBigIntPipe) salesInvoiceId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.salesInvoiceItemService.delete(
      salesInvoiceId,
      id,
      query.version,
    );
  }
}
