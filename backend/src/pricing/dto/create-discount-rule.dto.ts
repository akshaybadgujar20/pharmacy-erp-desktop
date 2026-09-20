import {
  IsInt,
  Min,
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

export class CreateDiscountRuleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  ruleCode!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  ruleName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  discountType!: string;

  @IsString()
  @IsNotEmpty()
  discountValue!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  appliesTo!: string;

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

  @IsInt()
  @Min(1)
  priority!: number;

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
