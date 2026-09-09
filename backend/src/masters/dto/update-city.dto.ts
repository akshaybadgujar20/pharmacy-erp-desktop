import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { OptionalBigIntField } from '../../common/dto/bigint.decorator';

export class UpdateCityDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsOptional()
  @OptionalBigIntField()
  stateId?: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  cityCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  cityName?: string;

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
