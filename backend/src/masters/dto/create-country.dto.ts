import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateCountryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  countryCode!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2)
  isoAlpha2!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(3)
  isoAlpha3!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  countryName!: string;

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
