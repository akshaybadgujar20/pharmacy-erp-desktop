import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import { CreateSequenceGeneratorDto } from '../dto/create-sequence-generator.dto';
import { SequenceGeneratorListQueryDto } from '../dto/sequence-generator-list-query.dto';
import { UpdateSequenceGeneratorDto } from '../dto/update-sequence-generator.dto';
import { SequenceGeneratorConfigService } from '../services/sequence-generator-config.service';

@Controller('sequence-generators')
export class SequenceGeneratorController {
  constructor(
    private readonly sequenceGeneratorConfigService: SequenceGeneratorConfigService,
  ) {}

  @Get()
  @RequirePermissions('CONFIGURATION:SEQUENCE_GENERATOR:READ')
  list(@Query() query: SequenceGeneratorListQueryDto) {
    return this.sequenceGeneratorConfigService.list(query);
  }

  @Get(':id')
  @RequirePermissions('CONFIGURATION:SEQUENCE_GENERATOR:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.sequenceGeneratorConfigService.getById(id);
  }

  @Post()
  @RequirePermissions('CONFIGURATION:SEQUENCE_GENERATOR:CREATE')
  create(@Body() dto: CreateSequenceGeneratorDto) {
    return this.sequenceGeneratorConfigService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('CONFIGURATION:SEQUENCE_GENERATOR:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateSequenceGeneratorDto,
  ) {
    return this.sequenceGeneratorConfigService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('CONFIGURATION:SEQUENCE_GENERATOR:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query('version', ParseIntPipe) version: number,
  ) {
    return this.sequenceGeneratorConfigService.delete(id, version);
  }
}
