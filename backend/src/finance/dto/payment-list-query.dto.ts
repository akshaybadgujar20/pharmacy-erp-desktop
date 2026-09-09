import { IsIn, IsOptional, Matches } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  FinanceReferenceType,
  PaymentStatus,
  PaymentType,
} from '../constants/finance.constants';

export class PaymentListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(Object.values(PaymentStatus))
  status?: string;

  @IsOptional()
  @IsIn(Object.values(PaymentType))
  paymentType?: string;

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
