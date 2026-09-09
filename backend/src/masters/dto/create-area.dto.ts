import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';

export class CreateAreaDto {
  @MandatoryBigIntField()
  cityId!: bigint;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  areaCode!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  areaName!: string;

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
