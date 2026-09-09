import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { OutboxSyncStatus } from '../../persistence/outbox/outbox-operation.constants';

const OUTBOX_SYNC_STATUSES = Object.values(OutboxSyncStatus);

export class OutboxListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(OUTBOX_SYNC_STATUSES)
  syncStatus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  entityType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceId?: string;
}
