import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  MandatoryBigIntField,
  OptionalBigIntField,
} from '../../common/dto/bigint.decorator';

export class CreateFinancialYearDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  financialYearCode!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  financialYearName!: string;

  @MandatoryBigIntField()
  startDate!: bigint;

  @MandatoryBigIntField()
  endDate!: bigint;

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
