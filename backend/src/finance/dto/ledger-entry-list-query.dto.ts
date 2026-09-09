import { IsIn, IsOptional, Matches } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { VoucherType } from '../constants/finance.constants';

export class LedgerEntryListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Matches(/^\d+$/)
  ledgerId?: string;

  @IsOptional()
  @IsIn(Object.values(VoucherType))
  voucherType?: string;

  @IsOptional()
  @Matches(/^\d+$/)
  voucherId?: string;

  @IsOptional()
  @Matches(/^\d+$/)
  dateFrom?: string;

  @IsOptional()
  @Matches(/^\d+$/)
  dateTo?: string;

  @IsOptional()
  isPosted?: boolean;
}
