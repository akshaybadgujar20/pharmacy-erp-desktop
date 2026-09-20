import {
  Min,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';

export class CreateStockTransferItemDto {
  @MandatoryBigIntField()
  batchId!: bigint;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  sentQuantity!: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  remarks?: string;
}
