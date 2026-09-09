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
  CreateMedicineCategoryDto,
  UpdateMedicineCategoryDto,
} from '../dto/create-medicine-category.dto';
import { MedicineCategoryListQueryDto } from '../dto/medicine-category-list-query.dto';
import { MedicineCategoryService } from '../services/medicine-category.service';

@Controller('medicine-categories')
export class MedicineCategoryController {
  constructor(
    private readonly medicineCategoryService: MedicineCategoryService,
  ) {}

  @Get()
  @RequirePermissions('MASTER:MEDICINE_CATEGORY:READ')
  list(@Query() query: MedicineCategoryListQueryDto) {
    return this.medicineCategoryService.list(query);
  }

  @Get(':id')
  @RequirePermissions('MASTER:MEDICINE_CATEGORY:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.medicineCategoryService.getById(id);
  }

  @Post()
  @RequirePermissions('MASTER:MEDICINE_CATEGORY:CREATE')
  create(@Body() dto: CreateMedicineCategoryDto) {
    return this.medicineCategoryService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('MASTER:MEDICINE_CATEGORY:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateMedicineCategoryDto,
  ) {
    return this.medicineCategoryService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('MASTER:MEDICINE_CATEGORY:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.medicineCategoryService.delete(id, query.version);
  }
}
