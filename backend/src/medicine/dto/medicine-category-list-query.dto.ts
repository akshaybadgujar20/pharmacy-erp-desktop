import { IsOptional, Matches } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class MedicineCategoryListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Matches(/^\d+$/)
  parentCategoryId?: string;

  @IsOptional()
  isActive?: boolean;
}
