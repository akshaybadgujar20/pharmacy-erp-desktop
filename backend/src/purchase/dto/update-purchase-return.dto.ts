import {
  IsIn,
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
import { PurchaseReturnType } from '../constants/purchase.constants';

export class UpdatePurchaseReturnDto {
  @IsInt()
  @Min(1)
  version!: number;

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
