import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';
import {
  Min,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateStockTransferItemDto {
  @MandatoryBigIntField()
  version!: bigint;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  sentQuantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  receivedQuantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  damagedQuantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  remarks?: string;
}
