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
import { CreateSalesPaymentDto } from '../dto/create-sales-payment.dto';
import { SalesWorkflowDto } from '../dto/sales-workflow.dto';
import { UpdateSalesPaymentDto } from '../dto/update-sales-payment.dto';
import { SalesPaymentService } from '../services/sales-payment.service';

@Controller('sales-invoices/:salesInvoiceId/payments')
export class SalesPaymentController {
  constructor(private readonly salesPaymentService: SalesPaymentService) {}

  @Get()
  @RequirePermissions('SALES:SALES_PAYMENT:READ')
  list(
    @Param('salesInvoiceId', ParseBigIntPipe) salesInvoiceId: bigint,
    @Query() query: PaginationQueryDto,
  ) {
    return this.salesPaymentService.list(salesInvoiceId, query);
  }

  @Get(':id')
  @RequirePermissions('SALES:SALES_PAYMENT:READ')
  getById(
    @Param('salesInvoiceId', ParseBigIntPipe) salesInvoiceId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
  ) {
    return this.salesPaymentService.getById(salesInvoiceId, id);
  }

  @Post()
  @RequirePermissions('SALES:SALES_PAYMENT:CREATE')
  create(
    @Param('salesInvoiceId', ParseBigIntPipe) salesInvoiceId: bigint,
    @Body() dto: CreateSalesPaymentDto,
  ) {
    return this.salesPaymentService.create(salesInvoiceId, dto);
  }

  @Patch(':id')
  @RequirePermissions('SALES:SALES_PAYMENT:UPDATE')
  update(
    @Param('salesInvoiceId', ParseBigIntPipe) salesInvoiceId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateSalesPaymentDto,
  ) {
    return this.salesPaymentService.update(salesInvoiceId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('SALES:SALES_PAYMENT:DELETE')
  delete(
    @Param('salesInvoiceId', ParseBigIntPipe) salesInvoiceId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.salesPaymentService.delete(salesInvoiceId, id, query.version);
  }

  @Post(':id/complete')
  @RequirePermissions('SALES:SALES_PAYMENT:COMPLETE')
  complete(
    @Param('salesInvoiceId', ParseBigIntPipe) salesInvoiceId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: SalesWorkflowDto,
  ) {
    return this.salesPaymentService.complete(salesInvoiceId, id, dto);
  }

  @Post(':id/cancel')
  @RequirePermissions('SALES:SALES_PAYMENT:CANCEL')
  cancel(
    @Param('salesInvoiceId', ParseBigIntPipe) salesInvoiceId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: SalesWorkflowDto,
  ) {
    return this.salesPaymentService.cancel(salesInvoiceId, id, dto);
  }
}
