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
import { CreateFinancialYearDto } from '../dto/create-financial-year.dto';
import { FinancialYearListQueryDto } from '../dto/financial-year-list-query.dto';
import { UpdateFinancialYearDto } from '../dto/update-financial-year.dto';
import { FinancialYearService } from '../services/financial-year.service';

@Controller('financial-years')
export class FinancialYearController {
  constructor(private readonly financialYearService: FinancialYearService) {}

  @Get()
  @RequirePermissions('CONFIGURATION:FINANCIAL_YEAR:READ')
  list(@Query() query: FinancialYearListQueryDto) {
    return this.financialYearService.list(query);
  }

  @Get(':id')
  @RequirePermissions('CONFIGURATION:FINANCIAL_YEAR:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.financialYearService.getById(id);
  }

  @Post()
  @RequirePermissions('CONFIGURATION:FINANCIAL_YEAR:CREATE')
  create(@Body() dto: CreateFinancialYearDto) {
    return this.financialYearService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('CONFIGURATION:FINANCIAL_YEAR:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateFinancialYearDto,
  ) {
    return this.financialYearService.update(id, dto);
  }

  @Post(':id/close')
  @RequirePermissions('CONFIGURATION:FINANCIAL_YEAR:CLOSE')
  close(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.financialYearService.close(id, query.version);
  }

  @Delete(':id')
  @RequirePermissions('CONFIGURATION:FINANCIAL_YEAR:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.financialYearService.delete(id, query.version);
  }
}
