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
import { AreaListQueryDto } from '../dto/area-list-query.dto';
import { CreateAreaDto } from '../dto/create-area.dto';
import { UpdateAreaDto } from '../dto/update-area.dto';
import { AreaService } from '../services/area.service';

@Controller('areas')
export class AreaController {
  constructor(private readonly areaService: AreaService) {}

  @Get()
  @RequirePermissions('LOOKUP:AREA:READ')
  list(@Query() query: AreaListQueryDto) {
    return this.areaService.list(query);
  }

  @Get(':id')
  @RequirePermissions('LOOKUP:AREA:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.areaService.getById(id);
  }

  @Post()
  @RequirePermissions('LOOKUP:AREA:CREATE')
  create(@Body() dto: CreateAreaDto) {
    return this.areaService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('LOOKUP:AREA:UPDATE')
  update(@Param('id', ParseBigIntPipe) id: bigint, @Body() dto: UpdateAreaDto) {
    return this.areaService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('LOOKUP:AREA:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.areaService.delete(id, query.version);
  }
}
