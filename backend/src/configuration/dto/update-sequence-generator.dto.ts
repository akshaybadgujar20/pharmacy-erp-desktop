import {
  IsInt,
  Min,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  MandatoryBigIntField,
  OptionalBigIntField,
} from '../../common/dto/bigint.decorator';

export class UpdateSequenceGeneratorDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsOptional()
  @OptionalBigIntField()
  branchId?: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  documentType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  prefix?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  suffix?: string;

  @IsOptional()
  @MandatoryBigIntField()
  currentNumber?: bigint;

  @IsOptional()
  @IsInt()
  @Min(1)
  incrementBy?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  paddingLength?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  resetPolicy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  format?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
