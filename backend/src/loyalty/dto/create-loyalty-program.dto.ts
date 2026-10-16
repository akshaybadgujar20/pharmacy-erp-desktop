import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  MandatoryBigIntField,
  OptionalBigIntField,
} from '../../common/dto/bigint.decorator';

export class CreateLoyaltyProgramDto {
  @IsString()
  @MaxLength(50)
  programCode!: string;

  @IsString()
  @MaxLength(200)
  programName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @IsNotEmpty()
  pointsPerAmount!: string;

  @IsString()
  @IsNotEmpty()
  redemptionValue!: string;

  @IsInt()
  @Min(1)
  minimumRedemptionPoints!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maximumRedemptionPoints?: number;

  @MandatoryBigIntField()
  effectiveFrom!: bigint;

  @OptionalBigIntField()
  effectiveTo?: bigint;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
