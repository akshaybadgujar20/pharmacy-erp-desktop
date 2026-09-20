import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';
import {
  Min,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateStockTakeItemDto {
  @MandatoryBigIntField()
  version!: bigint;

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
