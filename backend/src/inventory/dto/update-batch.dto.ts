import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';

export class UpdateBatchDto {
  @IsInt()
  @Min(1)
  version!: number;

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
