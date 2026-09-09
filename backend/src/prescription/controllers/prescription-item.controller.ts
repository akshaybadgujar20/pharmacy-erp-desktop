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
  CreatePrescriptionItemDto,
  UpdatePrescriptionItemDto,
} from '../dto/create-prescription-item.dto';
import { ReplacePrescriptionItemsDto } from '../dto/replace-prescription-items.dto';
import { PrescriptionItemService } from '../services/prescription-item.service';

@Controller('prescriptions/:prescriptionId/items')
export class PrescriptionItemController {
  constructor(
    private readonly prescriptionItemService: PrescriptionItemService,
  ) {}

  @Get()
  @RequirePermissions('PRESCRIPTION:PRESCRIPTION_ITEM:READ')
  list(
    @Param('prescriptionId', ParseBigIntPipe) prescriptionId: bigint,
    @Query() query: PaginationQueryDto,
  ) {
    return this.prescriptionItemService.list(prescriptionId, query);
  }

  @Put('replace')
  @RequirePermissions('PRESCRIPTION:PRESCRIPTION_ITEM:REPLACE')
  replace(
    @Param('prescriptionId', ParseBigIntPipe) prescriptionId: bigint,
    @Body() dto: ReplacePrescriptionItemsDto,
  ) {
    return this.prescriptionItemService.replace(prescriptionId, dto);
  }

  @Get(':id')
  @RequirePermissions('PRESCRIPTION:PRESCRIPTION_ITEM:READ')
  getById(
    @Param('prescriptionId', ParseBigIntPipe) prescriptionId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
  ) {
    return this.prescriptionItemService.getById(prescriptionId, id);
  }

  @Post()
  @RequirePermissions('PRESCRIPTION:PRESCRIPTION_ITEM:CREATE')
  create(
    @Param('prescriptionId', ParseBigIntPipe) prescriptionId: bigint,
    @Body() dto: CreatePrescriptionItemDto,
  ) {
    return this.prescriptionItemService.create(prescriptionId, dto);
  }

  @Patch(':id')
  @RequirePermissions('PRESCRIPTION:PRESCRIPTION_ITEM:UPDATE')
  update(
    @Param('prescriptionId', ParseBigIntPipe) prescriptionId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdatePrescriptionItemDto,
  ) {
    return this.prescriptionItemService.update(prescriptionId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('PRESCRIPTION:PRESCRIPTION_ITEM:DELETE')
  delete(
    @Param('prescriptionId', ParseBigIntPipe) prescriptionId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.prescriptionItemService.delete(
      prescriptionId,
      id,
      query.version,
    );
  }
}
