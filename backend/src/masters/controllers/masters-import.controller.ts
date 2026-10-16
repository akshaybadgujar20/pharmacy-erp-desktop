import { Body, Controller, Post } from '@nestjs/common';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { MastersImportDto } from '../dto/masters-import.dto';
import { MastersImportService } from '../services/masters-import.service';

@Controller('masters/import')
export class MastersImportController {
  constructor(private readonly importService: MastersImportService) {}

  @Post()
  @RequirePermissions('LOOKUP:COUNTRY:CREATE')
  import(@Body() dto: MastersImportDto) {
    return this.importService.import(dto);
  }
}
