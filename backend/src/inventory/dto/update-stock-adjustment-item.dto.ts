import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';
import {
  Min,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateStockAdjustmentItemDto {
  @MandatoryBigIntField()
  version!: bigint;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  quantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitCost?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  remarks?: string;
}
