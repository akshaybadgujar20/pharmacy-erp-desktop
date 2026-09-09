import { IsBoolean, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { OptionalBigIntField } from '../../common/dto/bigint.decorator';
import { Transform } from 'class-transformer';

export class UserSessionListQueryDto extends PaginationQueryDto {
  @OptionalBigIntField()
  userId?: bigint;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;
}
