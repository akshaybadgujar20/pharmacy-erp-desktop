import { IsBoolean, IsOptional } from 'class-validator';
import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';

export class CreateRolePermissionDto {
  @MandatoryBigIntField()
  permissionId!: bigint;

  @IsOptional()
  @IsBoolean()
  isGranted?: boolean;
}
