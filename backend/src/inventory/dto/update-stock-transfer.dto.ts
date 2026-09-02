import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  MandatoryBigIntField,
  OptionalBigIntField,
} from '../../common/dto/bigint.decorator';
import { StockTransferType } from '../constants/inventory.constants';

export class UpdateStockTransferDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsOptional()
  @MandatoryBigIntField()
  transferDate?: bigint;

  @IsOptional()
  @IsString()
  @IsIn(Object.values(StockTransferType))
  transferType?: string;

  @IsOptional()
  @OptionalBigIntField()
  expectedArrivalDate?: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}
