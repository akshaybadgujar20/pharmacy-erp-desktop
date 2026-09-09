import { IsBoolean, IsOptional } from 'class-validator';
import { OptionalBigIntField } from '../../common/dto/bigint.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class AreaListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @OptionalBigIntField()
  cityId?: bigint;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
