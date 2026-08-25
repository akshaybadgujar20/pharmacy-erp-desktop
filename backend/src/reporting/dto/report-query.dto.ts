import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsDateString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { REPORT_FORMATS, ReportFormat } from '../constants/reporting.constants';

export class ReportQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  branchId?: number;

  @IsOptional()
  @IsIn(REPORT_FORMATS)
  format?: ReportFormat = ReportFormat.JSON;
}
