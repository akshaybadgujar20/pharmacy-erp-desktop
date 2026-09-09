import { IsBoolean, IsOptional } from 'class-validator';
import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';

export class CreateUserRoleDto {
  @MandatoryBigIntField()
  roleId!: bigint;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
