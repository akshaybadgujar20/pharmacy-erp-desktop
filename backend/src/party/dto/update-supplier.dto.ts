import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { SupplierType } from '../constants/party.constants';
import { Type } from 'class-transformer';

export class UpdateSupplierDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  supplierCode?: string;

  @IsOptional()
  @IsString()
  @IsIn(Object.values(SupplierType))
  supplierType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  gstin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  drugLicenseNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  panNumber?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  creditLimit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  paymentTermsDays?: number;

  @IsOptional()
  @IsBoolean()
  preferredSupplier?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
