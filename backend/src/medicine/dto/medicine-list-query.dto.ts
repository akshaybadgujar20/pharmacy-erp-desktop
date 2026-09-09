import { IsOptional, Matches } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class MedicineListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Matches(/^\d+$/)
  manufacturerId?: string;

  @IsOptional()
  @Matches(/^\d+$/)
  categoryId?: string;

  @IsOptional()
  @Matches(/^\d+$/)
  scheduleId?: string;

  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  discontinued?: boolean;
}
