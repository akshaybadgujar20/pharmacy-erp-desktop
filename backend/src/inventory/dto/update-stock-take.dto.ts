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
import { StockTakeCountType } from '../constants/inventory.constants';

export class UpdateStockTakeDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsOptional()
  @OptionalBigIntField()
  stockTakeDate?: bigint;

  @IsOptional()
  @IsString()
  @IsIn(Object.values(StockTakeCountType))
  countType?: string;

  @IsOptional()
  @MandatoryBigIntField()
  countedByEmployeeId?: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}
