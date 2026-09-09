import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { OptionalBigIntField } from '../../common/dto/bigint.decorator';

export class UpdateTaxDto {
  @IsInt()
  @Min(1)
  version!: number;

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
  @OptionalBigIntField()
  effectiveTo?: bigint;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}
