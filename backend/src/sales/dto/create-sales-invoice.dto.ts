import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  MandatoryBigIntField,
  OptionalBigIntField,
} from '../../common/dto/bigint.decorator';
import { SalesType } from '../constants/sales.constants';

export class CreateSalesInvoiceDto {
  @MandatoryBigIntField()
  branchId!: bigint;

  @OptionalBigIntField()
  customerId?: bigint;

  @OptionalBigIntField()
  prescriptionId?: bigint;

  @MandatoryBigIntField()
  invoiceDate!: bigint;

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
  @MaxLength(1000)
  remarks?: string;
}
