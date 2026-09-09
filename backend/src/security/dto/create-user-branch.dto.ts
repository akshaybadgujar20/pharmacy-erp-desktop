import { IsBoolean, IsOptional } from 'class-validator';
import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';

export class CreateUserBranchDto {
  @MandatoryBigIntField()
  branchId!: bigint;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
