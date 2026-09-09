import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import {
  MandatoryBigIntField,
  OptionalBigIntField,
} from '../../common/dto/bigint.decorator';

export class CreateMedicineSaltDto {
  @MandatoryBigIntField()
  saltCompositionId!: bigint;

  @IsInt()
  @Min(1)
  sequenceNo!: number;

  @IsOptional()
  @IsString()
  percentage?: string;
}

export class UpdateMedicineSaltDto {
  @IsInt()
  @Min(1)
  version!: number;

  @OptionalBigIntField()
  saltCompositionId?: bigint;

  @IsOptional()
  @IsInt()
  @Min(1)
  sequenceNo?: number;

  @IsOptional()
  @IsString()
  percentage?: string;
}
