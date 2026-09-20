import { IsOptional, IsString, MaxLength } from 'class-validator';
import {
  MandatoryBigIntField,
  OptionalBigIntField,
} from '../../common/dto/bigint.decorator';

export class UpdatePurchaseOrderDto {
  @MandatoryBigIntField()
  version!: bigint;

  @IsOptional()
  @MandatoryBigIntField()
  supplierId?: bigint;

  @IsOptional()
  @MandatoryBigIntField()
  orderDate?: bigint;

  @IsOptional()
  @OptionalBigIntField()
  expectedDeliveryDate?: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  remarks?: string;
}
