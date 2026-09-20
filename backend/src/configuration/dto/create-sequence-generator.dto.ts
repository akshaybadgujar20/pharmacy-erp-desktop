import {
  IsInt,
  Min,
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

export class CreateSequenceGeneratorDto {
  @IsOptional()
  @OptionalBigIntField()
  branchId?: bigint;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  documentType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  prefix?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  suffix?: string;

  @MandatoryBigIntField()
  currentNumber!: bigint;

  @IsOptional()
  @IsInt()
  @Min(1)
  incrementBy?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  paddingLength?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  resetPolicy!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  format?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
