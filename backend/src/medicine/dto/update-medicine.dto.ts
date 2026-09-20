import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  NullableBigIntField,
  OptionalBigIntField,
} from '../../common/dto/bigint.decorator';

export class UpdateMedicineDto {
  @MandatoryBigIntField()
  version!: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  medicineName?: string;

  @OptionalBigIntField()
  manufacturerId?: bigint;

  @OptionalBigIntField()
  categoryId?: bigint;

  @NullableBigIntField()
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
