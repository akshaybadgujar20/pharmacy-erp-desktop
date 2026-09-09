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
import { CreatePrinterConfigurationDto } from '../dto/create-printer-configuration.dto';
import { PrinterConfigurationListQueryDto } from '../dto/printer-configuration-list-query.dto';
import { UpdatePrinterConfigurationDto } from '../dto/update-printer-configuration.dto';
import { PrinterConfigurationService } from '../services/printer-configuration.service';

@Controller('printer-configurations')
export class PrinterConfigurationController {
  constructor(
    private readonly printerConfigurationService: PrinterConfigurationService,
  ) {}

  @Get()
  @RequirePermissions('CONFIGURATION:PRINTER_CONFIGURATION:READ')
  list(@Query() query: PrinterConfigurationListQueryDto) {
    return this.printerConfigurationService.list(query);
  }

  @Get(':id')
  @RequirePermissions('CONFIGURATION:PRINTER_CONFIGURATION:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.printerConfigurationService.getById(id);
  }

  @Post()
  @RequirePermissions('CONFIGURATION:PRINTER_CONFIGURATION:CREATE')
  create(@Body() dto: CreatePrinterConfigurationDto) {
    return this.printerConfigurationService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('CONFIGURATION:PRINTER_CONFIGURATION:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdatePrinterConfigurationDto,
  ) {
    return this.printerConfigurationService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('CONFIGURATION:PRINTER_CONFIGURATION:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.printerConfigurationService.delete(id, query.version);
  }
}
