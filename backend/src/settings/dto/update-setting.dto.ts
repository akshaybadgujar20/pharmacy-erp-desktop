import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateSettingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  settingValue!: string;
}
