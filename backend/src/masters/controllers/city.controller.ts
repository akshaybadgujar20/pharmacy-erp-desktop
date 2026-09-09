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
import { CityListQueryDto } from '../dto/city-list-query.dto';
import { CreateCityDto } from '../dto/create-city.dto';
import { UpdateCityDto } from '../dto/update-city.dto';
import { CityService } from '../services/city.service';

@Controller('cities')
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @Get()
  @RequirePermissions('LOOKUP:CITY:READ')
  list(@Query() query: CityListQueryDto) {
    return this.cityService.list(query);
  }

  @Get(':id')
  @RequirePermissions('LOOKUP:CITY:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.cityService.getById(id);
  }

  @Post()
  @RequirePermissions('LOOKUP:CITY:CREATE')
  create(@Body() dto: CreateCityDto) {
    return this.cityService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('LOOKUP:CITY:UPDATE')
  update(@Param('id', ParseBigIntPipe) id: bigint, @Body() dto: UpdateCityDto) {
    return this.cityService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('LOOKUP:CITY:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.cityService.delete(id, query.version);
  }
}
