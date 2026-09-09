import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  MandatoryBigIntField,
  OptionalBigIntField,
} from '../../common/dto/bigint.decorator';

export class UpdateFinancialYearDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  financialYearCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  financialYearName?: string;

  @IsOptional()
  @MandatoryBigIntField()
  startDate?: bigint;

  @IsOptional()
  @MandatoryBigIntField()
  endDate?: bigint;

  @IsOptional()
  @OptionalBigIntField()
  branchId?: bigint;

  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;

  @IsOptional()
  @IsString()
  remarks?: string;
}
