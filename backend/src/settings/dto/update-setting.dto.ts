import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateSettingDto {
  @MandatoryBigIntField()
  version!: bigint;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  settingValue!: string;
}
