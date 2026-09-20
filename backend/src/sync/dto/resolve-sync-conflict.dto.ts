import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { SyncConflictResolutionStrategy } from '../constants/sync.constants';

const RESOLUTION_STRATEGIES = Object.values(SyncConflictResolutionStrategy);

export class ResolveSyncConflictDto {
  @MandatoryBigIntField()
  version!: bigint;

  @IsIn(RESOLUTION_STRATEGIES)
  resolutionStrategy!: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
