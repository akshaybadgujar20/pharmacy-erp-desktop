import { IsOptional, IsString, MaxLength } from 'class-validator';
import { OptionalBigIntField } from '../../common/dto/bigint.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ChangeHistoryListQueryDto extends PaginationQueryDto {
  @OptionalBigIntField()
  auditLogId?: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  entityType?: string;

  @OptionalBigIntField()
  entityId?: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  entityUuid?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  fieldName?: string;
}
