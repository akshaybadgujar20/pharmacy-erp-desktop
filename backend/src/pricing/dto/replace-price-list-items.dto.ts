import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  MandatoryBigIntField,
  OptionalBigIntField,
} from '../../common/dto/bigint.decorator';

export class ReplacePriceListItemDto {
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

export class ReplacePriceListItemsDto {
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => ReplacePriceListItemDto)
  items!: ReplacePriceListItemDto[];
}
