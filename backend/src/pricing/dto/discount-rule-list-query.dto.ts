import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class DiscountRuleListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  appliesTo?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
