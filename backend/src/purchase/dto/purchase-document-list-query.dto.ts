import { IsOptional, IsString } from 'class-validator';
import {
  MandatoryBigIntField,
  OptionalBigIntField,
} from '../../common/dto/bigint.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class PurchaseDocumentListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @MandatoryBigIntField()
  supplierId?: bigint;

  @IsOptional()
  @OptionalBigIntField()
  fromDate?: bigint;

  @IsOptional()
  @OptionalBigIntField()
  toDate?: bigint;
}

export class GoodsReceiptListQueryDto extends PurchaseDocumentListQueryDto {
  @IsOptional()
  @MandatoryBigIntField()
  purchaseOrderId?: bigint;
}
