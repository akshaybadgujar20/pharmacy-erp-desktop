import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';

export class CreateStockAdjustmentItemDto {
  @MandatoryBigIntField()
  stockAdjustmentId!: bigint;

  @MandatoryBigIntField()
  batchId!: bigint;

  @IsInt()
  @Min(1)
  @IsNumber()
  quantity!: number;

  @IsInt()
  @Min(0)
  unitCost!: number;

  @IsString()
  @MaxLength(255)
  remarks?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
