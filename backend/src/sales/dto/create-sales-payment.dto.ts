import { Type } from 'class-transformer';
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
import { SalesPaymentMethod } from '../constants/sales.constants';

export class CreateSalesPaymentDto {
  @MandatoryBigIntField()
  paymentDate!: bigint;

  @IsString()
  @IsIn(Object.values(SalesPaymentMethod))
  paymentMethod!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  paymentAmount!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  tenderedAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  changeReturned?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  transactionReference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4)
  cardLast4Digits?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  cardType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  posTerminalId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  bankName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  chequeNumber?: string;

  @OptionalBigIntField()
  chequeDate?: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  remarks?: string;
}
