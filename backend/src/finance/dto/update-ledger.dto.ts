import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { OptionalBigIntField } from '../../common/dto/bigint.decorator';
import { LedgerType, NormalBalance } from '../constants/finance.constants';

export class UpdateLedgerDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  ledgerCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  ledgerName?: string;

  @IsOptional()
  @IsIn(Object.values(LedgerType))
  ledgerType?: string;

  @IsOptional()
  @IsIn(Object.values(NormalBalance))
  normalBalance?: string;

  @OptionalBigIntField()
  parentLedgerId?: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
