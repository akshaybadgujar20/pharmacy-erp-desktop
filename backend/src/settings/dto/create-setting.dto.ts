import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { OptionalBigIntField } from '../../common/dto/bigint.decorator';

export class CreateSettingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  settingKey!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  settingName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  settingValue?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  dataType!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  category!: string;

  @IsOptional()
  @IsString()
  defaultValue?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @OptionalBigIntField()
  branchId?: bigint;

  @IsOptional()
  @IsBoolean()
  isEditable?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
