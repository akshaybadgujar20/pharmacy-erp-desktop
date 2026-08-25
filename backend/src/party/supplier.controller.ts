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
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SupplierService } from './supplier.service';

@Controller('suppliers')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Get()
  @RequirePermissions('PARTY:SUPPLIER:READ')
  list(@Query() query: PaginationQueryDto) {
    return this.supplierService.list(query);
  }

  @Get(':id')
  @RequirePermissions('PARTY:SUPPLIER:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.supplierService.getById(id);
  }

  @Post()
  @RequirePermissions('PARTY:SUPPLIER:CREATE')
  create(@Body() dto: CreateSupplierDto) {
    return this.supplierService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('PARTY:SUPPLIER:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.supplierService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('PARTY:SUPPLIER:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query('version') version: string,
  ) {
    return this.supplierService.delete(id, Number(version));
  }
}
