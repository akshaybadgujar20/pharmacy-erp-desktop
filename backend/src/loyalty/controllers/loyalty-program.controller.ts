import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import { CreateLoyaltyProgramDto } from '../dto/create-loyalty-program.dto';
import { LoyaltyProgramListQueryDto } from '../dto/loyalty-program-list-query.dto';
import { UpdateLoyaltyProgramDto } from '../dto/update-loyalty-program.dto';
import { LoyaltyExpiryService } from '../services/loyalty-expiry.service';
import { LoyaltyProgramService } from '../services/loyalty-program.service';

@Controller('loyalty-programs')
export class LoyaltyProgramController {
  constructor(
    private readonly loyaltyProgramService: LoyaltyProgramService,
    private readonly loyaltyExpiryService: LoyaltyExpiryService,
  ) {}

  @Post('expire-points/run')
  @RequirePermissions('LOYALTY:LOYALTY_PROGRAM:UPDATE')
  runExpiry() {
    return this.loyaltyExpiryService.runExpiryJob();
  }

  @Get()
  @RequirePermissions('LOYALTY:LOYALTY_PROGRAM:READ')
  list(@Query() query: LoyaltyProgramListQueryDto) {
    return this.loyaltyProgramService.list(query);
  }

  @Get(':id')
  @RequirePermissions('LOYALTY:LOYALTY_PROGRAM:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.loyaltyProgramService.getById(id);
  }

  @Post()
  @RequirePermissions('LOYALTY:LOYALTY_PROGRAM:CREATE')
  create(@Body() dto: CreateLoyaltyProgramDto) {
    return this.loyaltyProgramService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('LOYALTY:LOYALTY_PROGRAM:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateLoyaltyProgramDto,
  ) {
    return this.loyaltyProgramService.update(id, dto);
  }
}
