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
  ReceiptType,
} from '../constants/finance.constants';

export class UpdateReceiptDto {
  @MandatoryBigIntField()
  version!: bigint;

  @IsOptional()
  @IsIn(Object.values(ReceiptType))
  receiptType?: string;

  @IsOptional()
  @MandatoryBigIntField()
  receiptDate?: bigint;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsIn(Object.values(PaymentMethod))
  receiptMethod?: string;

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
