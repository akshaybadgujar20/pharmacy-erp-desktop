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
import { CreateCompanyDto } from '../dto/create-company.dto';
import { CompanyListQueryDto } from '../dto/company-list-query.dto';
import { UpdateCompanyDto } from '../dto/update-company.dto';
import { CompanyService } from '../services/company.service';

@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  @RequirePermissions('CONFIGURATION:COMPANY:READ')
  list(@Query() query: CompanyListQueryDto) {
    return this.companyService.list(query);
  }

  @Get(':id')
  @RequirePermissions('CONFIGURATION:COMPANY:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.companyService.getById(id);
  }

  @Post()
  @RequirePermissions('CONFIGURATION:COMPANY:CREATE')
  create(@Body() dto: CreateCompanyDto) {
    return this.companyService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('CONFIGURATION:COMPANY:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companyService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('CONFIGURATION:COMPANY:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.companyService.delete(id, query.version);
  }
}
