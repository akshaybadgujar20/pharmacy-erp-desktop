import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { OptionalBigIntField } from '../../common/dto/bigint.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class FinancialYearListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @OptionalBigIntField()
  branchId?: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;

  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;
}
