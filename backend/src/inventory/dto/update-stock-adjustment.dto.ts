import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';
import { StockAdjustmentType } from '../constants/inventory.constants';

export class UpdateStockAdjustmentDto {
  @MandatoryBigIntField()
  version!: bigint;

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
