import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  MandatoryBigIntField,
  OptionalBigIntField,
} from '../../common/dto/bigint.decorator';

export class CreateMedicineDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  medicineCode!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  medicineName!: string;

  @MandatoryBigIntField()
  manufacturerId!: bigint;

  @MandatoryBigIntField()
  categoryId!: bigint;

  @OptionalBigIntField()
  scheduleId?: bigint;

  @MandatoryBigIntField()
  unitId!: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  brandName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  strength?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  dosageForm!: string;

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
