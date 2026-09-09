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
  CreateMedicineScheduleDto,
  UpdateMedicineScheduleDto,
} from '../dto/create-medicine-schedule.dto';
import { MedicineScheduleListQueryDto } from '../dto/medicine-schedule-list-query.dto';
import { MedicineScheduleService } from '../services/medicine-schedule.service';

@Controller('medicine-schedules')
export class MedicineScheduleController {
  constructor(
    private readonly medicineScheduleService: MedicineScheduleService,
  ) {}

  @Get()
  @RequirePermissions('MASTER:MEDICINE_SCHEDULE:READ')
  list(@Query() query: MedicineScheduleListQueryDto) {
    return this.medicineScheduleService.list(query);
  }

  @Get(':id')
  @RequirePermissions('MASTER:MEDICINE_SCHEDULE:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.medicineScheduleService.getById(id);
  }

  @Post()
  @RequirePermissions('MASTER:MEDICINE_SCHEDULE:CREATE')
  create(@Body() dto: CreateMedicineScheduleDto) {
    return this.medicineScheduleService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('MASTER:MEDICINE_SCHEDULE:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateMedicineScheduleDto,
  ) {
    return this.medicineScheduleService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('MASTER:MEDICINE_SCHEDULE:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.medicineScheduleService.delete(id, query.version);
  }
}
