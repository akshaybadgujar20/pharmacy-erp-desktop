import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class SalesWorkflowDto {
  @MandatoryBigIntField()
  version!: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  redeemPoints?: number;
}
