import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  NullableBigIntField,
  OptionalBigIntField,
} from '../../common/dto/bigint.decorator';

export class UpdateTaxDto {
  @MandatoryBigIntField()
  version!: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  taxCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  taxName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  taxType?: string;

  @IsOptional()
  @IsString()
  taxRate?: string;

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
  description?: string;
}
