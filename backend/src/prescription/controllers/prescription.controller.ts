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
import { CreatePrescriptionDto } from '../dto/create-prescription.dto';
import { PrescriptionListQueryDto } from '../dto/prescription-list-query.dto';
import { PrescriptionWorkflowDto } from '../dto/prescription-workflow.dto';
import { UpdatePrescriptionDto } from '../dto/update-prescription.dto';
import { PrescriptionService } from '../services/prescription.service';

@Controller('prescriptions')
export class PrescriptionController {
  constructor(private readonly prescriptionService: PrescriptionService) {}

  @Get()
  @RequirePermissions('PRESCRIPTION:PRESCRIPTION:READ')
  list(@Query() query: PrescriptionListQueryDto) {
    return this.prescriptionService.list(query);
  }

  @Get(':id')
  @RequirePermissions('PRESCRIPTION:PRESCRIPTION:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.prescriptionService.getById(id);
  }

  @Post()
  @RequirePermissions('PRESCRIPTION:PRESCRIPTION:CREATE')
  create(@Body() dto: CreatePrescriptionDto) {
    return this.prescriptionService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('PRESCRIPTION:PRESCRIPTION:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdatePrescriptionDto,
  ) {
    return this.prescriptionService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('PRESCRIPTION:PRESCRIPTION:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.prescriptionService.delete(id, query.version);
  }

  @Post(':id/activate')
  @RequirePermissions('PRESCRIPTION:PRESCRIPTION:ACTIVATE')
  activate(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: PrescriptionWorkflowDto,
  ) {
    return this.prescriptionService.activate(id, dto);
  }

  @Post(':id/cancel')
  @RequirePermissions('PRESCRIPTION:PRESCRIPTION:CANCEL')
  cancel(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: PrescriptionWorkflowDto,
  ) {
    return this.prescriptionService.cancel(id, dto);
  }

  @Post(':id/expire')
  @RequirePermissions('PRESCRIPTION:PRESCRIPTION:EXPIRE')
  expire(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: PrescriptionWorkflowDto,
  ) {
    return this.prescriptionService.expire(id, dto);
  }
}
