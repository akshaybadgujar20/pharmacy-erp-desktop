import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';
import {
  IsInt,
  Min,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { OptionalBigIntField } from '../../common/dto/bigint.decorator';

export class UpdatePrinterConfigurationDto {
  @MandatoryBigIntField()
  version!: bigint;

  @IsOptional()
  @OptionalBigIntField()
  branchId?: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  printerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  printerType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  documentType?: string;

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
