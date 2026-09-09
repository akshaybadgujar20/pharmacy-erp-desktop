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

export class CreatePriceListDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  priceListCode!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  priceListName!: string;

  @IsOptional()
  @OptionalBigIntField()
  branchId?: bigint;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  priceListType!: string;

  @MandatoryBigIntField()
  effectiveFrom!: bigint;

  @IsOptional()
  @OptionalBigIntField()
  effectiveTo?: bigint;

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
