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
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { ParseBigIntPipe } from '../common/pipes/parse-bigint.pipe';
import { DoctorService } from './doctor.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

@Controller('doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get()
  @RequirePermissions('PARTY:DOCTOR:READ')
  list(@Query() query: PaginationQueryDto) {
    return this.doctorService.list(query);
  }

  @Get(':id')
  @RequirePermissions('PARTY:DOCTOR:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.doctorService.getById(id);
  }

  @Post()
  @RequirePermissions('PARTY:DOCTOR:CREATE')
  create(@Body() dto: CreateDoctorDto) {
    return this.doctorService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('PARTY:DOCTOR:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateDoctorDto,
  ) {
    return this.doctorService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('PARTY:DOCTOR:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query('version') version: string,
  ) {
    return this.doctorService.delete(id, Number(version));
  }
}
