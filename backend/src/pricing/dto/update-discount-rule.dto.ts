import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';
import {
  IsInt,
  Min,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  NullableBigIntField,
  OptionalBigIntField,
} from '../../common/dto/bigint.decorator';

export class UpdateDiscountRuleDto {
  @MandatoryBigIntField()
  version!: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  ruleCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ruleName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  discountType?: string;

  @IsOptional()
  @IsString()
  discountValue?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  appliesTo?: string;

  @IsOptional()
  @NullableBigIntField()
  medicineId?: bigint | null;

  @IsOptional()
  @NullableBigIntField()
  categoryId?: bigint | null;

  @IsOptional()
  @NullableBigIntField()
  customerId?: bigint | null;

  @IsOptional()
  @NullableBigIntField()
  priceListId?: bigint | null;

  @IsOptional()
  @IsString()
  minimumQuantity?: string;

  @IsOptional()
  @IsString()
  minimumAmount?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  priority?: number;

  @IsOptional()
  @OptionalBigIntField()
  effectiveFrom?: bigint;

  @IsOptional()
  @NullableBigIntField()
  effectiveTo?: bigint | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  remarks?: string;
}
