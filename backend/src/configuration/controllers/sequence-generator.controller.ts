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
import { CreateSequenceGeneratorDto } from '../dto/create-sequence-generator.dto';
import { SequenceGeneratorListQueryDto } from '../dto/sequence-generator-list-query.dto';
import { UpdateSequenceGeneratorDto } from '../dto/update-sequence-generator.dto';
import { SequenceGeneratorService } from '../services/sequence-generator.service';

@Controller('sequence-generators')
export class SequenceGeneratorController {
  constructor(
    private readonly sequenceGeneratorService: SequenceGeneratorService,
  ) {}

  @Get()
  @RequirePermissions('CONFIGURATION:SEQUENCE_GENERATOR:READ')
  list(@Query() query: SequenceGeneratorListQueryDto) {
    return this.sequenceGeneratorService.list(query);
  }

  @Get(':id')
  @RequirePermissions('CONFIGURATION:SEQUENCE_GENERATOR:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.sequenceGeneratorService.getById(id);
  }

  @Post()
  @RequirePermissions('CONFIGURATION:SEQUENCE_GENERATOR:CREATE')
  create(@Body() dto: CreateSequenceGeneratorDto) {
    return this.sequenceGeneratorService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('CONFIGURATION:SEQUENCE_GENERATOR:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateSequenceGeneratorDto,
  ) {
    return this.sequenceGeneratorService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('CONFIGURATION:SEQUENCE_GENERATOR:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.sequenceGeneratorService.delete(id, query.version);
  }
}
