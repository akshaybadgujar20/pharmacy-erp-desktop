import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';

export class CreateBatchDto {
  @MandatoryBigIntField()
  medicineId!: bigint;

  @IsString()
  @IsNotEmpty()
  batchNumber!: string;

  @MandatoryBigIntField()
  manufacturingDate!: bigint;

  @MandatoryBigIntField()
  expiryDate!: bigint;

  @IsOptional()
  @IsNumber()
  @Min(0)
  purchaseRate!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  mrp!: number;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
