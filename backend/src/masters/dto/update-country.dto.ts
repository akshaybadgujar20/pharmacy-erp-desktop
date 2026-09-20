import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCountryDto {
  @MandatoryBigIntField()
  version!: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  countryCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  isoAlpha2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  isoAlpha3?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  countryName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nationality?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  phoneCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currencyCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  timezone?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
