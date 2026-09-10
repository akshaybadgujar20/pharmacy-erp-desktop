import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  ClearableOptionalBigIntField,
  MandatoryBigIntField,
  OptionalBigIntField,
} from '../../common/dto/bigint.decorator';

export class CreatePriceListItemDto {
  @MandatoryBigIntField()
  medicineId!: bigint;

  @IsString()
  @IsNotEmpty()
  sellingPrice!: string;

  @IsString()
  @IsNotEmpty()
  mrp!: string;

  @IsOptional()
  @IsString()
  minimumSellingPrice?: string;

  @IsOptional()
  @IsString()
  discountPercent?: string;

  @IsOptional()
  @OptionalBigIntField()
  taxId?: bigint;

  @MandatoryBigIntField()
  effectiveFrom!: bigint;

  @IsOptional()
  @OptionalBigIntField()
  effectiveTo?: bigint;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdatePriceListItemDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsOptional()
  @MandatoryBigIntField()
  medicineId?: bigint;

  @IsOptional()
  @IsString()
  sellingPrice?: string;

  @IsOptional()
  @IsString()
  mrp?: string;

  @IsOptional()
  @IsString()
  minimumSellingPrice?: string;

  @IsOptional()
  @IsString()
  discountPercent?: string;

  @IsOptional()
  @ClearableOptionalBigIntField()
  taxId?: bigint | null;

  @IsOptional()
  @OptionalBigIntField()
  effectiveFrom?: bigint;

  @IsOptional()
  @ClearableOptionalBigIntField()
  effectiveTo?: bigint | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  remarks?: string;
}
