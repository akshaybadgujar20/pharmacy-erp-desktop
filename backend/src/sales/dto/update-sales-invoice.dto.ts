import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { OptionalBigIntField } from '../../common/dto/bigint.decorator';
import { SalesPaymentMode, SalesType } from '../constants/sales.constants';

export class UpdateSalesInvoiceDto {
  @MandatoryBigIntField()
  version!: bigint;

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
