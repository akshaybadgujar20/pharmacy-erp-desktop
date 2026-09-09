import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  MandatoryBigIntField,
  OptionalBigIntField,
} from '../../common/dto/bigint.decorator';

export class CreateGoodsReceiptDto {
  @MandatoryBigIntField()
  branchId!: bigint;

  @MandatoryBigIntField()
  supplierId!: bigint;

  @OptionalBigIntField()
  purchaseOrderId?: bigint;

  @MandatoryBigIntField()
  receiptDate!: bigint;

  @MandatoryBigIntField()
  receivedByEmployeeId!: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  supplierChallanNo?: string;

  @IsOptional()
  @OptionalBigIntField()
  supplierChallanDate?: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  supplierInvoiceNo?: string;

  @IsOptional()
  @OptionalBigIntField()
  supplierInvoiceDate?: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  vehicleNumber?: string;

  @IsOptional()
  @IsBoolean()
  isColdChainMaintained?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  remarks?: string;
}
