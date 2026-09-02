import { IsIn, IsOptional, Matches } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { OptionalBigIntField } from '../../common/dto/bigint.decorator';
import {
  StockMovementDirection,
  StockMovementType,
} from '../constants/inventory.constants';

export class StockMovementListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Matches(/^\d+$/)
  branchId?: string;

  @IsOptional()
  @Matches(/^\d+$/)
  batchId?: string;

  @IsOptional()
  @Matches(/^\d+$/)
  medicineId?: string;

  @IsOptional()
  @IsIn(Object.values(StockMovementType))
  movementType?: string;

  @IsOptional()
  @IsIn(Object.values(StockMovementDirection))
  movementDirection?: string;

  @IsOptional()
  @OptionalBigIntField()
  fromDate?: bigint;

  @IsOptional()
  @OptionalBigIntField()
  toDate?: bigint;
}
