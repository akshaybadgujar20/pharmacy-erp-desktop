import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class TaxListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  taxType?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
