import { IsOptional, Matches } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class SaltCompositionListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Matches(/^\d+$/)
  genericId?: string;

  @IsOptional()
  isActive?: boolean;
}
