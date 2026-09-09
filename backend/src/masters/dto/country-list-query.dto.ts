import { IsBoolean, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class CountryListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
