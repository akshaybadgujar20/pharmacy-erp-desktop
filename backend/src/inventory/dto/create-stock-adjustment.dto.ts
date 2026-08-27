import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';

export class CreateStockAdjustmentDto {
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
  createdBy!: bigint;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
