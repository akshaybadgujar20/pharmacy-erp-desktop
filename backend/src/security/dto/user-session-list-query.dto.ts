import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, Matches } from 'class-validator';
import { OptionalBigIntField } from '../../common/dto/bigint.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class UserSessionListQueryDto extends PaginationQueryDto {
  @OptionalBigIntField()
  userId?: bigint;

  @OptionalBigIntField()
  branchId?: bigint;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Matches(/^\d+$/)
  loginFrom?: string;

  @IsOptional()
  @Matches(/^\d+$/)
  loginTo?: string;
}
