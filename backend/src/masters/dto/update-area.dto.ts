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

export class UpdateAreaDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsOptional()
  @OptionalBigIntField()
  cityId?: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  areaCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  areaName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  deliveryZone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  routeCode?: string;

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
