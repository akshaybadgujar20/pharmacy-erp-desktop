import { IsBoolean, IsOptional } from 'class-validator';
import { OptionalBigIntField } from '../../common/dto/bigint.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class StateListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @OptionalBigIntField()
  countryId?: bigint;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
