import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import {
  MandatoryBigIntField,
  OptionalBigIntField,
} from '../../common/dto/bigint.decorator';

export class UpdatePurchaseInvoiceDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsOptional()
  @MandatoryBigIntField()
  supplierId?: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  supplierInvoiceNumber?: string;

  @IsOptional()
  @OptionalBigIntField()
  goodsReceiptId?: bigint;

  @IsOptional()
  @MandatoryBigIntField()
  invoiceDate?: bigint;

  @IsOptional()
  @OptionalBigIntField()
  dueDate?: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  remarks?: string;
}
