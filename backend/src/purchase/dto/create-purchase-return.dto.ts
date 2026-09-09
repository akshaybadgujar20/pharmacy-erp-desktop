import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  MandatoryBigIntField,
  OptionalBigIntField,
} from '../../common/dto/bigint.decorator';
import { PurchaseReturnType } from '../constants/purchase.constants';

export class CreatePurchaseReturnDto {
  @MandatoryBigIntField()
  branchId!: bigint;

  @MandatoryBigIntField()
  supplierId!: bigint;

  @OptionalBigIntField()
  purchaseInvoiceId?: bigint;

  @MandatoryBigIntField()
  returnDate!: bigint;

  @IsString()
  @IsIn(Object.values(PurchaseReturnType))
  returnType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  returnReason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  remarks?: string;
}
