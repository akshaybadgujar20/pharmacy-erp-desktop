import {
  Min,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  MandatoryBigIntField,
  OptionalBigIntField,
} from '../../common/dto/bigint.decorator';

export class CreateBatchDto {
  @MandatoryBigIntField()
  medicineId!: bigint;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  batchNumber!: string;

  @OptionalBigIntField()
  manufacturingDate?: bigint;

  @MandatoryBigIntField()
  expiryDate!: bigint;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  purchaseRate!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  mrp!: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  barcode?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
