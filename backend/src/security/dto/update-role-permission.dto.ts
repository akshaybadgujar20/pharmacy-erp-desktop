import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateRolePermissionDto {
  @MandatoryBigIntField()
  version!: bigint;

  @IsOptional()
  @IsBoolean()
  isGranted?: boolean;
}
