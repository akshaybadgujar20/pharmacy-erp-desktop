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
import { CreatePurchaseReturnDto } from '../dto/create-purchase-return.dto';
import { PurchaseWorkflowDto } from '../dto/purchase-workflow.dto';
import { UpdatePurchaseReturnDto } from '../dto/update-purchase-return.dto';
import { PurchaseReturnService } from '../services/purchase-return.service';

@Controller('purchase-returns')
export class PurchaseReturnController {
  constructor(private readonly purchaseReturnService: PurchaseReturnService) {}

  @Get()
  @RequirePermissions('PURCHASE:PURCHASE_RETURN:READ')
  list(@Query() query: PaginationQueryDto) {
    return this.purchaseReturnService.list(query);
  }

  @Get(':id')
  @RequirePermissions('PURCHASE:PURCHASE_RETURN:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.purchaseReturnService.getById(id);
  }

  @Post()
  @RequirePermissions('PURCHASE:PURCHASE_RETURN:CREATE')
  create(@Body() dto: CreatePurchaseReturnDto) {
    return this.purchaseReturnService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('PURCHASE:PURCHASE_RETURN:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdatePurchaseReturnDto,
  ) {
    return this.purchaseReturnService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('PURCHASE:PURCHASE_RETURN:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.purchaseReturnService.delete(id, query.version);
  }

  @Post(':id/submit')
  @RequirePermissions('PURCHASE:PURCHASE_RETURN:SUBMIT')
  submit(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: PurchaseWorkflowDto,
  ) {
    return this.purchaseReturnService.submit(id, dto);
  }

  @Post(':id/approve')
  @RequirePermissions('PURCHASE:PURCHASE_RETURN:APPROVE')
  approve(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: PurchaseWorkflowDto,
  ) {
    return this.purchaseReturnService.approve(id, dto);
  }

  @Post(':id/reject')
  @RequirePermissions('PURCHASE:PURCHASE_RETURN:REJECT')
  reject(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: PurchaseWorkflowDto,
  ) {
    return this.purchaseReturnService.reject(id, dto);
  }

  @Post(':id/cancel')
  @RequirePermissions('PURCHASE:PURCHASE_RETURN:CANCEL')
  cancel(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: PurchaseWorkflowDto,
  ) {
    return this.purchaseReturnService.cancel(id, dto);
  }
}
