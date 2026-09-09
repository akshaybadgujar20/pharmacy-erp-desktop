import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class SyncLogListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  syncType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  syncDirection?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceId?: string;
}
