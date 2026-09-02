import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';
import { StockAdjustmentType } from '../constants/inventory.constants';

export class UpdateStockAdjustmentDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsOptional()
  @IsString()
  @IsIn(Object.values(StockAdjustmentType))
  adjustmentType?: string;

  @IsOptional()
  @MandatoryBigIntField()
  adjustmentDate?: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
