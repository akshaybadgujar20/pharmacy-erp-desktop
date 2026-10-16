import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { DeleteEntityQueryDto } from '../common/dto/delete-entity-query.dto';
import { ParseBigIntPipe } from '../common/pipes/parse-bigint.pipe';
import { ReportFavoriteService } from './report-favorite.service';

class AddReportFavoriteDto {
  reportCode!: string;
}

@Controller('report-favorites')
export class ReportFavoriteController {
  constructor(private readonly favorites: ReportFavoriteService) {}

  @Get()
  @RequirePermissions('REPORTING:REPORT:READ')
  list() {
    return this.favorites.listForCurrentUser();
  }

  @Post()
  @RequirePermissions('REPORTING:REPORT:READ')
  add(@Body() dto: AddReportFavoriteDto) {
    return this.favorites.add(dto.reportCode);
  }

  @Delete(':id')
  @RequirePermissions('REPORTING:REPORT:READ')
  remove(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.favorites.remove(id, query.version);
  }
}
