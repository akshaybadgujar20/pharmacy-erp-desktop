import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  MandatoryBigIntField,
  OptionalBigIntField,
} from '../../common/dto/bigint.decorator';
import { StockTransferType } from '../constants/inventory.constants';

export class CreateStockTransferDto {
  @MandatoryBigIntField()
  sourceBranchId!: bigint;

  @MandatoryBigIntField()
  destinationBranchId!: bigint;

  @MandatoryBigIntField()
  transferDate!: bigint;

  @IsString()
  @IsIn(Object.values(StockTransferType))
  transferType!: string;

  @IsOptional()
  @OptionalBigIntField()
  expectedArrivalDate?: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}
