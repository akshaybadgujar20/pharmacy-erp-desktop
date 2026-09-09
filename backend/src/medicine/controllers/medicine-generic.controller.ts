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
  CreateMedicineGenericDto,
  UpdateMedicineGenericDto,
} from '../dto/create-medicine-generic.dto';
import { MedicineGenericListQueryDto } from '../dto/medicine-generic-list-query.dto';
import { MedicineGenericService } from '../services/medicine-generic.service';

@Controller('medicine-generics')
export class MedicineGenericController {
  constructor(
    private readonly medicineGenericService: MedicineGenericService,
  ) {}

  @Get()
  @RequirePermissions('MASTER:MEDICINE_GENERIC:READ')
  list(@Query() query: MedicineGenericListQueryDto) {
    return this.medicineGenericService.list(query);
  }

  @Get(':id')
  @RequirePermissions('MASTER:MEDICINE_GENERIC:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.medicineGenericService.getById(id);
  }

  @Post()
  @RequirePermissions('MASTER:MEDICINE_GENERIC:CREATE')
  create(@Body() dto: CreateMedicineGenericDto) {
    return this.medicineGenericService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('MASTER:MEDICINE_GENERIC:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateMedicineGenericDto,
  ) {
    return this.medicineGenericService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('MASTER:MEDICINE_GENERIC:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.medicineGenericService.delete(id, query.version);
  }
}
