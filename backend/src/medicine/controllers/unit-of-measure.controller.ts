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
import {
  CreateUnitOfMeasureDto,
  UpdateUnitOfMeasureDto,
} from '../dto/create-unit-of-measure.dto';
import { UnitOfMeasureListQueryDto } from '../dto/unit-of-measure-list-query.dto';
import { UnitOfMeasureService } from '../services/unit-of-measure.service';

@Controller('units-of-measure')
export class UnitOfMeasureController {
  constructor(private readonly unitOfMeasureService: UnitOfMeasureService) {}

  @Get()
  @RequirePermissions('MASTER:UNIT_OF_MEASURE:READ')
  list(@Query() query: UnitOfMeasureListQueryDto) {
    return this.unitOfMeasureService.list(query);
  }

  @Get(':id')
  @RequirePermissions('MASTER:UNIT_OF_MEASURE:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.unitOfMeasureService.getById(id);
  }

  @Post()
  @RequirePermissions('MASTER:UNIT_OF_MEASURE:CREATE')
  create(@Body() dto: CreateUnitOfMeasureDto) {
    return this.unitOfMeasureService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('MASTER:UNIT_OF_MEASURE:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateUnitOfMeasureDto,
  ) {
    return this.unitOfMeasureService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('MASTER:UNIT_OF_MEASURE:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.unitOfMeasureService.delete(id, query.version);
  }
}
