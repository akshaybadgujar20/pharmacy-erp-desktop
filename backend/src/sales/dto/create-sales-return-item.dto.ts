import { Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';
import {
  SalesReturnDisposition,
  SalesReturnReason,
} from '../constants/sales.constants';

export class CreateSalesReturnItemDto {
  @MandatoryBigIntField()
  salesInvoiceItemId!: bigint;

  @MandatoryBigIntField()
  medicineId!: bigint;

  @MandatoryBigIntField()
  batchId!: bigint;

  @MandatoryBigIntField()
  unitId!: bigint;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  returnQuantity!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  unitPrice!: number;

  @IsString()
  @IsIn(Object.values(SalesReturnReason))
  returnReason!: string;

  @IsOptional()
  @IsString()
  @IsIn([SalesReturnDisposition.RESTOCK])
  disposition?: string;

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
