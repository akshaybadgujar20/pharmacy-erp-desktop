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
import { PurchaseDocumentListQueryDto } from '../dto/purchase-document-list-query.dto';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import { CreatePurchaseInvoiceDto } from '../dto/create-purchase-invoice.dto';
import { PurchaseWorkflowDto } from '../dto/purchase-workflow.dto';
import { UpdatePurchaseInvoiceDto } from '../dto/update-purchase-invoice.dto';
import { PurchaseInvoiceService } from '../services/purchase-invoice.service';

@Controller('purchase-invoices')
export class PurchaseInvoiceController {
  constructor(
    private readonly purchaseInvoiceService: PurchaseInvoiceService,
  ) {}

  @Get()
  @RequirePermissions('PURCHASE:PURCHASE_INVOICE:READ')
  list(@Query() query: PurchaseDocumentListQueryDto) {
    return this.purchaseInvoiceService.list(query);
  }

  @Get(':id')
  @RequirePermissions('PURCHASE:PURCHASE_INVOICE:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.purchaseInvoiceService.getById(id);
  }

  @Post()
  @RequirePermissions('PURCHASE:PURCHASE_INVOICE:CREATE')
  create(@Body() dto: CreatePurchaseInvoiceDto) {
    return this.purchaseInvoiceService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('PURCHASE:PURCHASE_INVOICE:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdatePurchaseInvoiceDto,
  ) {
    return this.purchaseInvoiceService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('PURCHASE:PURCHASE_INVOICE:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.purchaseInvoiceService.delete(id, query.version);
  }

  @Post(':id/post')
  @RequirePermissions('PURCHASE:PURCHASE_INVOICE:POST')
  post(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: PurchaseWorkflowDto,
  ) {
    return this.purchaseInvoiceService.post(id, dto);
  }

  @Post(':id/cancel')
  @RequirePermissions('PURCHASE:PURCHASE_INVOICE:CANCEL')
  cancel(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: PurchaseWorkflowDto,
  ) {
    return this.purchaseInvoiceService.cancel(id, dto);
  }
}
