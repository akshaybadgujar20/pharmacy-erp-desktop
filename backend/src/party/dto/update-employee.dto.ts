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
import { Type } from 'class-transformer';

export class UpdateEmployeeDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  employeeCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  designation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @OptionalBigIntField()
  joiningDate?: bigint;

  @OptionalBigIntField()
  leavingDate?: bigint;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  salary?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  licenseNumber?: string;

  @IsOptional()
  @IsBoolean()
  isPharmacist?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
