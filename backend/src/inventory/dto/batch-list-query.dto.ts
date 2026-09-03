import { IsOptional, Matches } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class BatchListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Matches(/^\d+$/)
  medicineId?: string;
}
