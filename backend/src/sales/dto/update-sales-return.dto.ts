import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { OptionalBigIntField } from '../../common/dto/bigint.decorator';
import {
  SalesRefundMode,
  SalesReturnReason,
} from '../constants/sales.constants';

export class UpdateSalesReturnDto {
  @MandatoryBigIntField()
  version!: bigint;

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
