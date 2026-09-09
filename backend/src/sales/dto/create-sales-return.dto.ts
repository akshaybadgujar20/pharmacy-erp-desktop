import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  MandatoryBigIntField,
  OptionalBigIntField,
} from '../../common/dto/bigint.decorator';
import { SalesReturnReason } from '../constants/sales.constants';

export class CreateSalesReturnDto {
  @MandatoryBigIntField()
  branchId!: bigint;

  @MandatoryBigIntField()
  salesInvoiceId!: bigint;

  @OptionalBigIntField()
  customerId?: bigint;

  @MandatoryBigIntField()
  returnDate!: bigint;

  @IsString()
  @IsIn(Object.values(SalesReturnReason))
  returnReason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  remarks?: string;
}
