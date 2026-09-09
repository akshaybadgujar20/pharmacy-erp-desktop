import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { OptionalBigIntField } from '../../common/dto/bigint.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class SequenceGeneratorListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  documentType?: string;

  @IsOptional()
  @OptionalBigIntField()
  branchId?: bigint;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
