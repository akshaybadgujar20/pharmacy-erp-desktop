import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import { CreateLoyaltyAdjustmentDto } from '../dto/create-loyalty-adjustment.dto';
import { LoyaltyTransactionListQueryDto } from '../dto/loyalty-transaction-list-query.dto';
import { LoyaltyCustomerService } from '../services/loyalty-customer.service';

@Controller('customers/:customerId/loyalty')
export class LoyaltyCustomerController {
  constructor(
    private readonly loyaltyCustomerService: LoyaltyCustomerService,
  ) {}

  @Get('summary')
  @RequirePermissions('LOYALTY:LOYALTY_PROGRAM:READ')
  summary(@Param('customerId', ParseBigIntPipe) customerId: bigint) {
    return this.loyaltyCustomerService.getSummary(customerId);
  }

  @Get('transactions')
  @RequirePermissions('LOYALTY:LOYALTY_PROGRAM:READ')
  transactions(
    @Param('customerId', ParseBigIntPipe) customerId: bigint,
    @Query() query: LoyaltyTransactionListQueryDto,
  ) {
    return this.loyaltyCustomerService.listTransactions(customerId, query);
  }

  @Post('adjustments')
  @RequirePermissions('LOYALTY:LOYALTY_PROGRAM:UPDATE')
  adjust(
    @Param('customerId', ParseBigIntPipe) customerId: bigint,
    @Body() dto: CreateLoyaltyAdjustmentDto,
  ) {
    return this.loyaltyCustomerService.adjust(customerId, dto);
  }
}
