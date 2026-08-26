import { IsIn, IsOptional, IsDateString } from 'class-validator';
import { OptionalBigIntField } from '../../common/dto/optional-bigint.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { REPORT_FORMATS, ReportFormat } from '../constants/reporting.constants';

export class ReportQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @OptionalBigIntField()
  branchId?: bigint;

  @IsOptional()
  @IsIn(REPORT_FORMATS)
  format?: ReportFormat = ReportFormat.JSON;
}
