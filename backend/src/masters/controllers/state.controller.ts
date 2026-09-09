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
import { CreateStateDto } from '../dto/create-state.dto';
import { StateListQueryDto } from '../dto/state-list-query.dto';
import { UpdateStateDto } from '../dto/update-state.dto';
import { StateService } from '../services/state.service';

@Controller('states')
export class StateController {
  constructor(private readonly stateService: StateService) {}

  @Get()
  @RequirePermissions('LOOKUP:STATE:READ')
  list(@Query() query: StateListQueryDto) {
    return this.stateService.list(query);
  }

  @Get(':id')
  @RequirePermissions('LOOKUP:STATE:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.stateService.getById(id);
  }

  @Post()
  @RequirePermissions('LOOKUP:STATE:CREATE')
  create(@Body() dto: CreateStateDto) {
    return this.stateService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('LOOKUP:STATE:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateStateDto,
  ) {
    return this.stateService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('LOOKUP:STATE:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.stateService.delete(id, query.version);
  }
}
