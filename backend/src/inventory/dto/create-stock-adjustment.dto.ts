import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';
import { StockAdjustmentType } from '../constants/inventory.constants';

export class CreateStockAdjustmentDto {
  @MandatoryBigIntField()
  branchId!: bigint;

  @IsString()
  @IsNotEmpty()
  @IsIn(Object.values(StockAdjustmentType))
  adjustmentType!: string;

  @MandatoryBigIntField()
  adjustmentDate!: bigint;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
