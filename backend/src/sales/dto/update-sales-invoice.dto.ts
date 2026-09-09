import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { OptionalBigIntField } from '../../common/dto/bigint.decorator';
import { SalesPaymentMode, SalesType } from '../constants/sales.constants';

export class UpdateSalesInvoiceDto {
  @IsInt()
  @Min(1)
  version!: number;

  @OptionalBigIntField()
  customerId?: bigint;

  @OptionalBigIntField()
  prescriptionId?: bigint;

  @OptionalBigIntField()
  invoiceDate?: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  patientName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  doctorName?: string;

  @IsOptional()
  @IsString()
  @IsIn(Object.values(SalesType))
  salesType?: string;

  @IsOptional()
  @IsString()
  @IsIn(Object.values(SalesPaymentMode))
  paymentMode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  remarks?: string;
}
