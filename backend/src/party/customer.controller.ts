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
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { ParseBigIntPipe } from '../common/pipes/parse-bigint.pipe';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  @RequirePermissions('PARTY:CUSTOMER:READ')
  list(@Query() query: PaginationQueryDto) {
    return this.customerService.list(query);
  }

  @Get(':id')
  @RequirePermissions('PARTY:CUSTOMER:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.customerService.getById(id);
  }

  @Post()
  @RequirePermissions('PARTY:CUSTOMER:CREATE')
  create(@Body() dto: CreateCustomerDto) {
    return this.customerService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('PARTY:CUSTOMER:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customerService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('PARTY:CUSTOMER:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query('version') version: string,
  ) {
    return this.customerService.delete(id, Number(version));
  }
}
