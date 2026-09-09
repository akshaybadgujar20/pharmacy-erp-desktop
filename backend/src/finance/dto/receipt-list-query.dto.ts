import { IsIn, IsOptional, Matches } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  FinanceReferenceType,
  ReceiptStatus,
  ReceiptType,
} from '../constants/finance.constants';

export class ReceiptListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(Object.values(ReceiptStatus))
  status?: string;

  @IsOptional()
  @IsIn(Object.values(ReceiptType))
  receiptType?: string;

  @IsOptional()
  @IsIn(Object.values(FinanceReferenceType))
  referenceType?: string;

  @IsOptional()
  @Matches(/^\d+$/)
  referenceId?: string;

  @IsOptional()
  @Matches(/^\d+$/)
  dateFrom?: string;

  @IsOptional()
  @Matches(/^\d+$/)
  dateTo?: string;
}
