import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { OptionalBigIntField } from '../../common/dto/bigint.decorator';

export class UpdateStateDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsOptional()
  @OptionalBigIntField()
  countryId?: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  stateCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  stateName?: string;

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
