import { IsOptional, Matches } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class StockListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Matches(/^\d+$/)
  branchId?: string;

  @IsOptional()
  @Matches(/^\d+$/)
  batchId?: string;

  @IsOptional()
  @Matches(/^\d+$/)
  medicineId?: string;
}
