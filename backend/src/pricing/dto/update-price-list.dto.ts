import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  NullableBigIntField,
  OptionalBigIntField,
} from '../../common/dto/bigint.decorator';

export class UpdatePriceListDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  priceListCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  priceListName?: string;

  @IsOptional()
  @NullableBigIntField()
  branchId?: bigint | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  priceListType?: string;

  @IsOptional()
  @OptionalBigIntField()
  effectiveFrom?: bigint;

  @IsOptional()
  @NullableBigIntField()
  effectiveTo?: bigint | null;

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
