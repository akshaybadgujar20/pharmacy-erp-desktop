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
import { CreateDiscountRuleDto } from '../dto/create-discount-rule.dto';
import { DiscountRuleListQueryDto } from '../dto/discount-rule-list-query.dto';
import { UpdateDiscountRuleDto } from '../dto/update-discount-rule.dto';
import { DiscountRuleService } from '../services/discount-rule.service';

@Controller('discount-rules')
export class DiscountRuleController {
  constructor(private readonly discountRuleService: DiscountRuleService) {}

  @Get()
  @RequirePermissions('PRICING:DISCOUNT_RULE:READ')
  list(@Query() query: DiscountRuleListQueryDto) {
    return this.discountRuleService.list(query);
  }

  @Get(':id')
  @RequirePermissions('PRICING:DISCOUNT_RULE:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.discountRuleService.getById(id);
  }

  @Post()
  @RequirePermissions('PRICING:DISCOUNT_RULE:CREATE')
  create(@Body() dto: CreateDiscountRuleDto) {
    return this.discountRuleService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('PRICING:DISCOUNT_RULE:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateDiscountRuleDto,
  ) {
    return this.discountRuleService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('PRICING:DISCOUNT_RULE:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.discountRuleService.delete(id, query.version);
  }
}
