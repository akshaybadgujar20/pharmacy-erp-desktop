import { IsOptional, IsString, MaxLength } from 'class-validator';
import {
  MandatoryBigIntField,
  OptionalBigIntField,
} from '../../common/dto/bigint.decorator';

export class CreatePurchaseInvoiceDto {
  @MandatoryBigIntField()
  branchId!: bigint;

  @MandatoryBigIntField()
  supplierId!: bigint;

  @IsString()
  @MaxLength(100)
  supplierInvoiceNumber!: string;

  @OptionalBigIntField()
  goodsReceiptId?: bigint;

  @MandatoryBigIntField()
  invoiceDate!: bigint;

  @OptionalBigIntField()
  dueDate?: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  remarks?: string;
}
