import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @MandatoryBigIntField()
  version!: bigint;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  mustChangePassword?: boolean;
}
