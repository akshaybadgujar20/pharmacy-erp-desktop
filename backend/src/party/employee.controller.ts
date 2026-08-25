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
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Controller('employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get()
  @RequirePermissions('PARTY:EMPLOYEE:READ')
  list(@Query() query: PaginationQueryDto) {
    return this.employeeService.list(query);
  }

  @Get(':id')
  @RequirePermissions('PARTY:EMPLOYEE:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.employeeService.getById(id);
  }

  @Post()
  @RequirePermissions('PARTY:EMPLOYEE:CREATE')
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeeService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('PARTY:EMPLOYEE:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employeeService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('PARTY:EMPLOYEE:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query('version') version: string,
  ) {
    return this.employeeService.delete(id, Number(version));
  }
}
