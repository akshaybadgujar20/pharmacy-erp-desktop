import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, ValidateIf } from 'class-validator';
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
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @Transform(({ value }: { value: unknown }) => (value === null ? null : value))
  percentage?: string | null;
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
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @Transform(({ value }: { value: unknown }) => (value === null ? null : value))
  percentage?: string | null;
}
