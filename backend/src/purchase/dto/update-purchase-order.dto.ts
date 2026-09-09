import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import {
  MandatoryBigIntField,
  OptionalBigIntField,
} from '../../common/dto/bigint.decorator';

export class UpdatePurchaseOrderDto {
  @IsInt()
  @Min(1)
  version!: number;

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
