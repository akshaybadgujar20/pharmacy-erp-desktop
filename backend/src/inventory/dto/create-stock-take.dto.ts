import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';
import { StockTakeCountType } from '../constants/inventory.constants';

export class CreateStockTakeDto {
  @MandatoryBigIntField()
  branchId!: bigint;

  @MandatoryBigIntField()
  stockTakeDate!: bigint;

  @IsString()
  @IsIn(Object.values(StockTakeCountType))
  countType!: string;

  @MandatoryBigIntField()
  countedByEmployeeId!: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}
