import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { OptionalBigIntField } from '../../common/dto/bigint.decorator';
import {
  SalesRefundMode,
  SalesReturnReason,
} from '../constants/sales.constants';

export class UpdateSalesReturnDto {
  @IsInt()
  @Min(1)
  version!: number;

  @OptionalBigIntField()
  customerId?: bigint;

  @OptionalBigIntField()
  returnDate?: bigint;

  @IsOptional()
  @IsString()
  @IsIn(Object.values(SalesReturnReason))
  returnReason?: string;

  @IsOptional()
  @IsString()
  @IsIn(Object.values(SalesRefundMode))
  refundMode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  creditNoteNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  remarks?: string;
}
