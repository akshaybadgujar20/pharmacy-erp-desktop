import { IsIn, IsOptional, Matches } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { LedgerType } from '../constants/finance.constants';

export class LedgerListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(Object.values(LedgerType))
  ledgerType?: string;

  @IsOptional()
  @Matches(/^\d+$/)
  parentLedgerId?: string;

  @IsOptional()
  isActive?: boolean;
}
