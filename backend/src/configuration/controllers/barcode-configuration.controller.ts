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
import { CreateBarcodeConfigurationDto } from '../dto/create-barcode-configuration.dto';
import { BarcodeConfigurationListQueryDto } from '../dto/barcode-configuration-list-query.dto';
import { UpdateBarcodeConfigurationDto } from '../dto/update-barcode-configuration.dto';
import { BarcodeConfigurationService } from '../services/barcode-configuration.service';

@Controller('barcode-configurations')
export class BarcodeConfigurationController {
  constructor(
    private readonly barcodeConfigurationService: BarcodeConfigurationService,
  ) {}

  @Get()
  @RequirePermissions('CONFIGURATION:BARCODE_CONFIGURATION:READ')
  list(@Query() query: BarcodeConfigurationListQueryDto) {
    return this.barcodeConfigurationService.list(query);
  }

  @Get(':id')
  @RequirePermissions('CONFIGURATION:BARCODE_CONFIGURATION:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.barcodeConfigurationService.getById(id);
  }

  @Post()
  @RequirePermissions('CONFIGURATION:BARCODE_CONFIGURATION:CREATE')
  create(@Body() dto: CreateBarcodeConfigurationDto) {
    return this.barcodeConfigurationService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('CONFIGURATION:BARCODE_CONFIGURATION:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateBarcodeConfigurationDto,
  ) {
    return this.barcodeConfigurationService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('CONFIGURATION:BARCODE_CONFIGURATION:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.barcodeConfigurationService.delete(id, query.version);
  }
}
