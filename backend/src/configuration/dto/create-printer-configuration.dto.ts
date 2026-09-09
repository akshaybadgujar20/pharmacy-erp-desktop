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

export class CreatePrinterConfigurationDto {
  @IsOptional()
  @OptionalBigIntField()
  branchId?: bigint;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  printerName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  printerType!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  documentType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  printerPath?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  paperSize?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  copies?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  printOrientation?: string;

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
