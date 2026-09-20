import {
  Min,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  MandatoryBigIntField,
  OptionalBigIntField,
} from '../../common/dto/bigint.decorator';
import {
  FinanceReferenceType,
  PaymentMethod,
  PaymentType,
} from '../constants/finance.constants';

export class CreatePaymentDto {
  @IsIn(Object.values(PaymentType))
  paymentType!: string;

  @MandatoryBigIntField()
  paymentDate!: bigint;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @IsIn(Object.values(PaymentMethod))
  paymentMethod!: string;

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
