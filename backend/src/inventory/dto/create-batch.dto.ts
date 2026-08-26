import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { CustomerType } from '../constants/inventory.constants';
import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';

export class CreateBatchDto {
  @MandatoryBigIntField()
  medicineId!: bigint;

  @IsString()
  @IsNotEmpty()
  batchNumber!: string;

  @IsDateString()
  manufacturingDate!: string;

  @IsDateString()
  expiryDate!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  purchaseRate!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  mrp!: boolean;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
