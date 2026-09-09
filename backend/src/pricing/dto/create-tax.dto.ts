import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';

export class CreateTaxDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  taxCode!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  taxName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  taxType!: string;

  @IsString()
  @IsNotEmpty()
  taxRate!: string;

  @MandatoryBigIntField()
  effectiveFrom!: bigint;

  @IsOptional()
  @MandatoryBigIntField()
  effectiveTo?: bigint;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}
