import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';

export class CreateLoyaltyAdjustmentDto {
  @MandatoryBigIntField()
  loyaltyProgramId!: bigint;

  @IsInt()
  pointsDelta!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}
