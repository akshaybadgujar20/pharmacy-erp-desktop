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
import { CreatePurchaseOrderDto } from '../dto/create-purchase-order.dto';
import { PurchaseWorkflowDto } from '../dto/purchase-workflow.dto';
import { UpdatePurchaseOrderDto } from '../dto/update-purchase-order.dto';
import { PurchaseOrderService } from '../services/purchase-order.service';

@Controller('purchase-orders')
export class PurchaseOrderController {
  constructor(private readonly purchaseOrderService: PurchaseOrderService) {}

  @Get()
  @RequirePermissions('PURCHASE:PURCHASE_ORDER:READ')
  list(@Query() query: PurchaseDocumentListQueryDto) {
    return this.purchaseOrderService.list(query);
  }

  @Get(':id')
  @RequirePermissions('PURCHASE:PURCHASE_ORDER:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.purchaseOrderService.getById(id);
  }

  @Post()
  @RequirePermissions('PURCHASE:PURCHASE_ORDER:CREATE')
  create(@Body() dto: CreatePurchaseOrderDto) {
    return this.purchaseOrderService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('PURCHASE:PURCHASE_ORDER:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdatePurchaseOrderDto,
  ) {
    return this.purchaseOrderService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('PURCHASE:PURCHASE_ORDER:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.purchaseOrderService.delete(id, query.version);
  }

  @Post(':id/submit')
  @RequirePermissions('PURCHASE:PURCHASE_ORDER:SUBMIT')
  submit(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: PurchaseWorkflowDto,
  ) {
    return this.purchaseOrderService.submit(id, dto);
  }

  @Post(':id/approve')
  @RequirePermissions('PURCHASE:PURCHASE_ORDER:APPROVE')
  approve(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: PurchaseWorkflowDto,
  ) {
    return this.purchaseOrderService.approve(id, dto);
  }

  @Post(':id/reject')
  @RequirePermissions('PURCHASE:PURCHASE_ORDER:REJECT')
  reject(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: PurchaseWorkflowDto,
  ) {
    return this.purchaseOrderService.reject(id, dto);
  }

  @Post(':id/send')
  @RequirePermissions('PURCHASE:PURCHASE_ORDER:SEND')
  send(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: PurchaseWorkflowDto,
  ) {
    return this.purchaseOrderService.send(id, dto);
  }

  @Post(':id/force-close')
  @RequirePermissions('PURCHASE:PURCHASE_ORDER:FORCE_CLOSE')
  forceClose(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: PurchaseWorkflowDto,
  ) {
    return this.purchaseOrderService.forceClose(id, dto);
  }

  @Post(':id/cancel')
  @RequirePermissions('PURCHASE:PURCHASE_ORDER:CANCEL')
  cancel(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: PurchaseWorkflowDto,
  ) {
    return this.purchaseOrderService.cancel(id, dto);
  }
}
