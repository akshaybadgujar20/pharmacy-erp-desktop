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
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import { CreateReceiptDto } from '../dto/create-receipt.dto';
import { FinanceWorkflowDto } from '../dto/finance-workflow.dto';
import { ReceiptListQueryDto } from '../dto/receipt-list-query.dto';
import { UpdateReceiptDto } from '../dto/update-receipt.dto';
import { ReceiptService } from '../services/receipt.service';

@Controller('receipts')
export class ReceiptController {
  constructor(private readonly receiptService: ReceiptService) {}

  @Get()
  @RequirePermissions('FINANCE:RECEIPT:READ')
  list(@Query() query: ReceiptListQueryDto) {
    return this.receiptService.list(query);
  }

  @Get(':id')
  @RequirePermissions('FINANCE:RECEIPT:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.receiptService.getById(id);
  }

  @Post()
  @RequirePermissions('FINANCE:RECEIPT:CREATE')
  create(@Body() dto: CreateReceiptDto) {
    return this.receiptService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('FINANCE:RECEIPT:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateReceiptDto,
  ) {
    return this.receiptService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('FINANCE:RECEIPT:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.receiptService.delete(id, query.version);
  }

  @Post(':id/complete')
  @RequirePermissions('FINANCE:RECEIPT:COMPLETE')
  complete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: FinanceWorkflowDto,
  ) {
    return this.receiptService.complete(id, dto);
  }

  @Post(':id/cancel')
  @RequirePermissions('FINANCE:RECEIPT:CANCEL')
  cancel(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: FinanceWorkflowDto,
  ) {
    return this.receiptService.cancel(id, dto);
  }
}
