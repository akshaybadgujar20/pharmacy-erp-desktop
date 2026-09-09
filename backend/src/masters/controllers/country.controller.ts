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
import { CountryListQueryDto } from '../dto/country-list-query.dto';
import { CreateCountryDto } from '../dto/create-country.dto';
import { UpdateCountryDto } from '../dto/update-country.dto';
import { CountryService } from '../services/country.service';

@Controller('countries')
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  @Get()
  @RequirePermissions('LOOKUP:COUNTRY:READ')
  list(@Query() query: CountryListQueryDto) {
    return this.countryService.list(query);
  }

  @Get(':id')
  @RequirePermissions('LOOKUP:COUNTRY:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.countryService.getById(id);
  }

  @Post()
  @RequirePermissions('LOOKUP:COUNTRY:CREATE')
  create(@Body() dto: CreateCountryDto) {
    return this.countryService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('LOOKUP:COUNTRY:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateCountryDto,
  ) {
    return this.countryService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('LOOKUP:COUNTRY:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.countryService.delete(id, query.version);
  }
}
