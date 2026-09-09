import { Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  MandatoryBigIntField,
  OptionalBigIntField,
} from '../../common/dto/bigint.decorator';
import { GoodsReceiptInspectionStatus } from '../constants/purchase.constants';

export class CreateGoodsReceiptItemDto {
  @MandatoryBigIntField()
  medicineId!: bigint;

  @MandatoryBigIntField()
  unitId!: bigint;

  @OptionalBigIntField()
  purchaseOrderItemId?: bigint;

  @IsString()
  @MaxLength(100)
  batchNumber!: string;

  @OptionalBigIntField()
  manufacturingDate?: bigint;

  @MandatoryBigIntField()
  expiryDate!: bigint;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  receivedQuantity!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  freeQuantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  rejectedQuantity?: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  acceptedQuantity!: number;

  @IsOptional()
  @IsString()
  @IsIn(Object.values(GoodsReceiptInspectionStatus))
  inspectionStatus?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  conversionFactor?: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  purchaseRate!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  mrp!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  saleRate!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  discountPercent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  taxPercent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  taxAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}
