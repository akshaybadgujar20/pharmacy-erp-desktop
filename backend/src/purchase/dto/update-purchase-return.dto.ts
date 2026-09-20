import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  MandatoryBigIntField,
  OptionalBigIntField,
} from '../../common/dto/bigint.decorator';
import { PurchaseReturnType } from '../constants/purchase.constants';

export class UpdatePurchaseReturnDto {
  @MandatoryBigIntField()
  version!: bigint;

  @IsOptional()
  @MandatoryBigIntField()
  supplierId?: bigint;

  @IsOptional()
  @OptionalBigIntField()
  purchaseInvoiceId?: bigint;

  @IsOptional()
  @MandatoryBigIntField()
  returnDate?: bigint;

  @IsOptional()
  @IsString()
  @IsIn(Object.values(PurchaseReturnType))
  returnType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  returnReason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  remarks?: string;
}
