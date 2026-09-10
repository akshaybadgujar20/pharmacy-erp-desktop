import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class UpdateSettingDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  settingValue!: string;
}
