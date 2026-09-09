import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { DeleteEntityQueryDto } from '../../common/dto/delete-entity-query.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import {
  CreateMedicineSaltDto,
  UpdateMedicineSaltDto,
} from '../dto/create-medicine-salt.dto';
import { ReplaceMedicineSaltsDto } from '../dto/replace-medicine-salts.dto';
import { MedicineSaltService } from '../services/medicine-salt.service';

@Controller('medicines/:medicineId/salts')
export class MedicineSaltController {
  constructor(private readonly medicineSaltService: MedicineSaltService) {}

  @Get()
  @RequirePermissions('MASTER:MEDICINE_SALT:READ')
  list(
    @Param('medicineId', ParseBigIntPipe) medicineId: bigint,
    @Query() query: PaginationQueryDto,
  ) {
    return this.medicineSaltService.list(medicineId, query);
  }

  @Put('replace')
  @RequirePermissions('MASTER:MEDICINE_SALT:REPLACE')
  replace(
    @Param('medicineId', ParseBigIntPipe) medicineId: bigint,
    @Body() dto: ReplaceMedicineSaltsDto,
  ) {
    return this.medicineSaltService.replace(medicineId, dto);
  }

  @Get(':id')
  @RequirePermissions('MASTER:MEDICINE_SALT:READ')
  getById(
    @Param('medicineId', ParseBigIntPipe) medicineId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
  ) {
    return this.medicineSaltService.getById(medicineId, id);
  }

  @Post()
  @RequirePermissions('MASTER:MEDICINE_SALT:CREATE')
  create(
    @Param('medicineId', ParseBigIntPipe) medicineId: bigint,
    @Body() dto: CreateMedicineSaltDto,
  ) {
    return this.medicineSaltService.create(medicineId, dto);
  }

  @Patch(':id')
  @RequirePermissions('MASTER:MEDICINE_SALT:UPDATE')
  update(
    @Param('medicineId', ParseBigIntPipe) medicineId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateMedicineSaltDto,
  ) {
    return this.medicineSaltService.update(medicineId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('MASTER:MEDICINE_SALT:DELETE')
  delete(
    @Param('medicineId', ParseBigIntPipe) medicineId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.medicineSaltService.delete(medicineId, id, query.version);
  }
}
