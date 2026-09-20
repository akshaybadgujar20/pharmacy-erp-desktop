import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { UnitType } from '../constants/medicine.constants';

export class CreateUnitOfMeasureDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  unitCode!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  unitName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  shortName!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(Object.values(UnitType))
  unitType!: string;

  @IsOptional()
  @IsBoolean()
  decimalAllowed?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isSystemUnit?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateUnitOfMeasureDto {
  @MandatoryBigIntField()
  version!: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  unitCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  unitName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  shortName?: string;

  @IsOptional()
  @IsString()
  @IsIn(Object.values(UnitType))
  unitType?: string;

  @IsOptional()
  @IsBoolean()
  decimalAllowed?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isSystemUnit?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
