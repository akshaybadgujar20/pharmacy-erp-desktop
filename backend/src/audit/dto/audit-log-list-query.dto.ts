import { Type } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { OptionalBigIntField } from '../../common/dto/bigint.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class AuditLogListQueryDto extends PaginationQueryDto {
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
  @MaxLength(30)
  action?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  module?: string;

  @OptionalBigIntField()
  userId?: bigint;

  @IsOptional()
  @Type(() => Number)
  fromTimestamp?: number;

  @IsOptional()
  @Type(() => Number)
  toTimestamp?: number;
}
