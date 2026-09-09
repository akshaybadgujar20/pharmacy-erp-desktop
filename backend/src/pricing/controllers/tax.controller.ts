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
import { CreateTaxDto } from '../dto/create-tax.dto';
import { TaxListQueryDto } from '../dto/tax-list-query.dto';
import { UpdateTaxDto } from '../dto/update-tax.dto';
import { TaxService } from '../services/tax.service';

@Controller('taxes')
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @Get()
  @RequirePermissions('PRICING:TAX:READ')
  list(@Query() query: TaxListQueryDto) {
    return this.taxService.list(query);
  }

  @Get(':id')
  @RequirePermissions('PRICING:TAX:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.taxService.getById(id);
  }

  @Post()
  @RequirePermissions('PRICING:TAX:CREATE')
  create(@Body() dto: CreateTaxDto) {
    return this.taxService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('PRICING:TAX:UPDATE')
  update(@Param('id', ParseBigIntPipe) id: bigint, @Body() dto: UpdateTaxDto) {
    return this.taxService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('PRICING:TAX:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.taxService.delete(id, query.version);
  }
}
