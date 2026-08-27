import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';

export class UpdateStockAdjustmentDto {
  @IsInt()
  @Min(1)
  version!: number;

  @MandatoryBigIntField()
  batchId!: bigint;

  @IsNumber()
  @Min(0)
  adjustmentNumber!: number;

  @IsString()
  adjustmentType!: string;

  @IsString()
  reason!: string;

  @IsString()
  status!: string;

  @MandatoryBigIntField()
  approvedByEmployeeId!: bigint;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
