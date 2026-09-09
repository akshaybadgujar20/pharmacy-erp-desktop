import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { OptionalBigIntField } from '../../common/dto/bigint.decorator';

export class CreateBarcodeConfigurationDto {
  @IsOptional()
  @OptionalBigIntField()
  branchId?: bigint;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  configurationName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  barcodeType!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  appliesTo!: string;

  @IsString()
  @IsNotEmpty()
  labelWidth!: string;

  @IsString()
  @IsNotEmpty()
  labelHeight!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  dpi?: number;

  @IsOptional()
  @IsBoolean()
  showHumanReadableText?: boolean;

  @IsOptional()
  @IsString()
  template?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  remarks?: string;
}
