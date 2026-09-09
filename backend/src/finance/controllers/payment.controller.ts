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
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { FinanceWorkflowDto } from '../dto/finance-workflow.dto';
import { PaymentListQueryDto } from '../dto/payment-list-query.dto';
import { UpdatePaymentDto } from '../dto/update-payment.dto';
import { PaymentService } from '../services/payment.service';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  @RequirePermissions('FINANCE:PAYMENT:READ')
  list(@Query() query: PaymentListQueryDto) {
    return this.paymentService.list(query);
  }

  @Get(':id')
  @RequirePermissions('FINANCE:PAYMENT:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.paymentService.getById(id);
  }

  @Post()
  @RequirePermissions('FINANCE:PAYMENT:CREATE')
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('FINANCE:PAYMENT:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdatePaymentDto,
  ) {
    return this.paymentService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('FINANCE:PAYMENT:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.paymentService.delete(id, query.version);
  }

  @Post(':id/complete')
  @RequirePermissions('FINANCE:PAYMENT:COMPLETE')
  complete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: FinanceWorkflowDto,
  ) {
    return this.paymentService.complete(id, dto);
  }

  @Post(':id/cancel')
  @RequirePermissions('FINANCE:PAYMENT:CANCEL')
  cancel(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: FinanceWorkflowDto,
  ) {
    return this.paymentService.cancel(id, dto);
  }
}
