import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';

export class CreateCityDto {
  @MandatoryBigIntField()
  stateId!: bigint;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  cityCode!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  cityName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  postalRegion?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
