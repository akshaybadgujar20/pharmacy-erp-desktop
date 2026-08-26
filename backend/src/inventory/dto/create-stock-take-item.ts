import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { SupplierType } from '../constants/inventory.constants';

export class CreateStockTake {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/)
  partyId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  supplierCode!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(Object.values(SupplierType))
  supplierType!: string;

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
  @Matches(/^\d+(\.\d{1,2})?$/)
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
