import { Body, Controller, Param, Post } from '@nestjs/common';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import { EnrollCustomerDto } from '../dto/enroll-customer.dto';
import { LoyaltyEnrollmentService } from '../services/loyalty-enrollment.service';

@Controller('customers/:customerId/loyalty-enrollments')
export class LoyaltyEnrollmentController {
  constructor(private readonly enrollmentService: LoyaltyEnrollmentService) {}

  @Post()
  @RequirePermissions('LOYALTY:LOYALTY_MEMBERSHIP:CREATE')
  enroll(
    @Param('customerId', ParseBigIntPipe) customerId: bigint,
    @Body() dto: EnrollCustomerDto,
  ) {
    return this.enrollmentService.enroll(customerId, dto);
  }
}
