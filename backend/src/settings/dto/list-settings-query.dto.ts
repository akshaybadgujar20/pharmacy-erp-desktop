import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ListSettingsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;
}
