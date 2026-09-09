import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { OptionalBigIntField } from '../../common/dto/bigint.decorator';

export class UpdateDiscountRuleDto {
  @IsInt()
  @Min(1)
  version!: number;

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
  @OptionalBigIntField()
  medicineId?: bigint;

  @IsOptional()
  @OptionalBigIntField()
  categoryId?: bigint;

  @IsOptional()
  @OptionalBigIntField()
  customerId?: bigint;

  @IsOptional()
  @OptionalBigIntField()
  priceListId?: bigint;

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
  @OptionalBigIntField()
  effectiveTo?: bigint;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  remarks?: string;
}
