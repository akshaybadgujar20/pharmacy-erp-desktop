import { IsOptional, IsString, MaxLength } from 'class-validator';
import { OptionalBigIntField } from '../../common/dto/bigint.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class PrescriptionListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;

  @OptionalBigIntField()
  customerId?: bigint;

  @OptionalBigIntField()
  doctorId?: bigint;
}
