import { IsBoolean, IsOptional } from 'class-validator';
import { OptionalBigIntField } from '../../common/dto/bigint.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class CityListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @OptionalBigIntField()
  stateId?: bigint;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
