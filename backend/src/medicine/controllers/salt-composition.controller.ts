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
import { CreateSaltCompositionDto } from '../dto/create-salt-composition.dto';
import { SaltCompositionListQueryDto } from '../dto/salt-composition-list-query.dto';
import { UpdateSaltCompositionDto } from '../dto/update-salt-composition.dto';
import { SaltCompositionService } from '../services/salt-composition.service';

@Controller('salt-compositions')
export class SaltCompositionController {
  constructor(
    private readonly saltCompositionService: SaltCompositionService,
  ) {}

  @Get()
  @RequirePermissions('MASTER:SALT_COMPOSITION:READ')
  list(@Query() query: SaltCompositionListQueryDto) {
    return this.saltCompositionService.list(query);
  }

  @Get(':id')
  @RequirePermissions('MASTER:SALT_COMPOSITION:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.saltCompositionService.getById(id);
  }

  @Post()
  @RequirePermissions('MASTER:SALT_COMPOSITION:CREATE')
  create(@Body() dto: CreateSaltCompositionDto) {
    return this.saltCompositionService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('MASTER:SALT_COMPOSITION:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateSaltCompositionDto,
  ) {
    return this.saltCompositionService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('MASTER:SALT_COMPOSITION:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.saltCompositionService.delete(id, query.version);
  }
}
