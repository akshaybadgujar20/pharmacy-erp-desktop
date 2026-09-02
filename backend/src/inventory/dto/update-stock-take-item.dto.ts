import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateStockTakeItemDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  physicalQuantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  remarks?: string;
}
