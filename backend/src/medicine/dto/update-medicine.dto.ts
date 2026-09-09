import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { OptionalBigIntField } from '../../common/dto/bigint.decorator';

export class UpdateMedicineDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  medicineName?: string;

  @OptionalBigIntField()
  manufacturerId?: bigint;

  @OptionalBigIntField()
  categoryId?: bigint;

  @OptionalBigIntField()
  scheduleId?: bigint | null;

  @OptionalBigIntField()
  unitId?: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  brandName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  strength?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  dosageForm?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  packSize?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  hsnCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  barcode?: string;

  @IsOptional()
  @IsBoolean()
  requiresPrescription?: boolean;

  @IsOptional()
  @IsBoolean()
  narcoticDrug?: boolean;

  @IsOptional()
  @IsBoolean()
  refrigerated?: boolean;

  @IsOptional()
  @IsBoolean()
  discontinued?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
