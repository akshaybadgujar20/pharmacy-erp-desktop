import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  MandatoryBigIntField,
  OptionalBigIntField,
} from '../../common/dto/bigint.decorator';

export class UpdateGoodsReceiptDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsOptional()
  @MandatoryBigIntField()
  supplierId?: bigint;

  @IsOptional()
  @OptionalBigIntField()
  purchaseOrderId?: bigint;

  @IsOptional()
  @MandatoryBigIntField()
  receiptDate?: bigint;

  @IsOptional()
  @MandatoryBigIntField()
  receivedByEmployeeId?: bigint;

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
