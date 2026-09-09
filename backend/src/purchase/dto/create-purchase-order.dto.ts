import { IsOptional, IsString, MaxLength } from 'class-validator';
import {
  MandatoryBigIntField,
  OptionalBigIntField,
} from '../../common/dto/bigint.decorator';

export class CreatePurchaseOrderDto {
  @MandatoryBigIntField()
  branchId!: bigint;

  @MandatoryBigIntField()
  supplierId!: bigint;

  @MandatoryBigIntField()
  orderDate!: bigint;

  @OptionalBigIntField()
  expectedDeliveryDate?: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  remarks?: string;
}
