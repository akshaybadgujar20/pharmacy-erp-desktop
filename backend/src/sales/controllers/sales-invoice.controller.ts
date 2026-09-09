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
import { CreateSalesInvoiceDto } from '../dto/create-sales-invoice.dto';
import { SalesWorkflowDto } from '../dto/sales-workflow.dto';
import { UpdateSalesInvoiceDto } from '../dto/update-sales-invoice.dto';
import { SalesInvoiceService } from '../services/sales-invoice.service';

@Controller('sales-invoices')
export class SalesInvoiceController {
  constructor(private readonly salesInvoiceService: SalesInvoiceService) {}

  @Get()
  @RequirePermissions('SALES:SALES_INVOICE:READ')
  list(@Query() query: PaginationQueryDto) {
    return this.salesInvoiceService.list(query);
  }

  @Get(':id')
  @RequirePermissions('SALES:SALES_INVOICE:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.salesInvoiceService.getById(id);
  }

  @Post()
  @RequirePermissions('SALES:SALES_INVOICE:CREATE')
  create(@Body() dto: CreateSalesInvoiceDto) {
    return this.salesInvoiceService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('SALES:SALES_INVOICE:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateSalesInvoiceDto,
  ) {
    return this.salesInvoiceService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('SALES:SALES_INVOICE:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.salesInvoiceService.delete(id, query.version);
  }

  @Post(':id/post')
  @RequirePermissions('SALES:SALES_INVOICE:POST')
  post(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: SalesWorkflowDto,
  ) {
    return this.salesInvoiceService.post(id, dto);
  }

  @Post(':id/cancel')
  @RequirePermissions('SALES:SALES_INVOICE:CANCEL')
  cancel(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: SalesWorkflowDto,
  ) {
    return this.salesInvoiceService.cancel(id, dto);
  }
}
