import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  MandatoryBigIntField,
  OptionalBigIntField,
} from '../../common/dto/bigint.decorator';
import {
  FinanceReferenceType,
  PaymentMethod,
  ReceiptType,
} from '../constants/finance.constants';

export class CreateReceiptDto {
  @IsIn(Object.values(ReceiptType))
  receiptType!: string;

  @MandatoryBigIntField()
  receiptDate!: bigint;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @IsIn(Object.values(PaymentMethod))
  receiptMethod!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  transactionReference?: string;

  @IsOptional()
  @IsIn(Object.values(FinanceReferenceType))
  referenceType?: string;

  @OptionalBigIntField()
  referenceId?: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  remarks?: string;
}
