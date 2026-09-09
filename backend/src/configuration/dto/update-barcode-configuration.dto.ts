import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { OptionalBigIntField } from '../../common/dto/bigint.decorator';

export class UpdateBarcodeConfigurationDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsOptional()
  @OptionalBigIntField()
  branchId?: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  configurationName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  barcodeType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  appliesTo?: string;

  @IsOptional()
  @IsString()
  labelWidth?: string;

  @IsOptional()
  @IsString()
  labelHeight?: string;

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
