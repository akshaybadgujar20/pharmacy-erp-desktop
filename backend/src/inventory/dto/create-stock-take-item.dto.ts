import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';

export class CreateStockTakeItemDto {
  @MandatoryBigIntField()
  batchId!: bigint;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  physicalQuantity!: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  remarks?: string;
}
