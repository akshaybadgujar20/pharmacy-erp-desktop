import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { SupplierType } from '../constants/inventory.constants';

export class UpdateStockTakeDto {
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
  @IsString()
  creditLimit?: string;

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
