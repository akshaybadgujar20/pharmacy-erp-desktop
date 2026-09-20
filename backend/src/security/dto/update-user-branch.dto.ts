import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateUserBranchDto {
  @MandatoryBigIntField()
  version!: bigint;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
