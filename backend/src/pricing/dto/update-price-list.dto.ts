import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  NullableBigIntField,
  OptionalBigIntField,
} from '../../common/dto/bigint.decorator';

export class UpdatePriceListDto {
  @MandatoryBigIntField()
  version!: bigint;

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
