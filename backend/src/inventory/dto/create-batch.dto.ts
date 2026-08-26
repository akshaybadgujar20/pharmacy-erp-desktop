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
import { CustomerType } from '../constants/inventory.constants';

export class CreateBatchDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/)
  medicineId!: string;

  @IsString()
  @IsNotEmpty()
  batchNumber!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(Object.values(CustomerType))
  manufacturingDate!: string;

  @IsOptional()
  @IsString()
  expiryDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  purchaseRate?: number;

  @IsOptional()
  @IsBoolean()
  mrp?: boolean;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
