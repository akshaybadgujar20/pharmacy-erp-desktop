import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';

export class CreateStockAdjustmentItemDto {
  @MandatoryBigIntField()
  batchId!: bigint;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  quantity!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitCost!: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  remarks?: string;
}
