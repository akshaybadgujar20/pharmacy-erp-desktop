import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { SyncConflictResolutionStrategy } from '../constants/sync.constants';

const RESOLUTION_STRATEGIES = Object.values(SyncConflictResolutionStrategy);

export class ResolveSyncConflictDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsIn(RESOLUTION_STRATEGIES)
  resolutionStrategy!: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
