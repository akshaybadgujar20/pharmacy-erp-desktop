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
import { CreateManufacturerDto } from '../dto/create-manufacturer.dto';
import { ManufacturerListQueryDto } from '../dto/manufacturer-list-query.dto';
import { UpdateManufacturerDto } from '../dto/update-manufacturer.dto';
import { ManufacturerService } from '../services/manufacturer.service';

@Controller('manufacturers')
export class ManufacturerController {
  constructor(private readonly manufacturerService: ManufacturerService) {}

  @Get()
  @RequirePermissions('MASTER:MANUFACTURER:READ')
  list(@Query() query: ManufacturerListQueryDto) {
    return this.manufacturerService.list(query);
  }

  @Get(':id')
  @RequirePermissions('MASTER:MANUFACTURER:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.manufacturerService.getById(id);
  }

  @Post()
  @RequirePermissions('MASTER:MANUFACTURER:CREATE')
  create(@Body() dto: CreateManufacturerDto) {
    return this.manufacturerService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('MASTER:MANUFACTURER:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateManufacturerDto,
  ) {
    return this.manufacturerService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('MASTER:MANUFACTURER:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.manufacturerService.delete(id, query.version);
  }
}
