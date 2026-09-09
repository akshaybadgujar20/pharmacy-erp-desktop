import {
  IsIn,
  IsInt,
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
  PaymentType,
} from '../constants/finance.constants';

export class UpdatePaymentDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsOptional()
  @IsIn(Object.values(PaymentType))
  paymentType?: string;

  @IsOptional()
  @MandatoryBigIntField()
  paymentDate?: bigint;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsIn(Object.values(PaymentMethod))
  paymentMethod?: string;

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
