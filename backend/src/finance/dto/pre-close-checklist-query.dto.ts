import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { BigIntField } from '../../common/dto/bigint.decorator';
import { DeleteEntityQueryDto } from '../../common/dto/delete-entity-query.dto';

export class PreCloseChecklistQueryDto {
  @IsOptional()
  @BigIntField()
  branchId?: bigint;
}

export class CloseFinancialYearQueryDto extends DeleteEntityQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  force?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  forceReason?: string;
}
