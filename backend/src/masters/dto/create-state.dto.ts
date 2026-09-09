import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';

export class CreateStateDto {
  @MandatoryBigIntField()
  countryId!: bigint;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  stateCode!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  stateName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  gstStateCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  isoCode?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
