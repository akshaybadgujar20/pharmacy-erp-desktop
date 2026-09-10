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
import {
  RequireAnyPermission,
  RequirePermissions,
} from '../../auth/decorators/require-permissions.decorator';
import { DeleteEntityQueryDto } from '../../common/dto/delete-entity-query.dto';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import { CreateMedicineDto } from '../dto/create-medicine.dto';
import { MedicineListQueryDto } from '../dto/medicine-list-query.dto';
import { UpdateMedicineDto } from '../dto/update-medicine.dto';
import { MedicineService } from '../services/medicine.service';

@Controller('medicines')
export class MedicineController {
  constructor(private readonly medicineService: MedicineService) {}

  @Get()
  @RequireAnyPermission('MASTER:MEDICINE:READ', 'MASTER:MEDICINE:UPDATE')
  list(@Query() query: MedicineListQueryDto) {
    return this.medicineService.list(query);
  }

  @Get(':id')
  @RequireAnyPermission('MASTER:MEDICINE:READ', 'MASTER:MEDICINE:UPDATE')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.medicineService.getById(id);
  }

  @Post()
  @RequirePermissions('MASTER:MEDICINE:CREATE')
  create(@Body() dto: CreateMedicineDto) {
    return this.medicineService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('MASTER:MEDICINE:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateMedicineDto,
  ) {
    return this.medicineService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('MASTER:MEDICINE:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.medicineService.delete(id, query.version);
  }
}
