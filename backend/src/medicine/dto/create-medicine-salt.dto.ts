import { IsInt, Min, IsOptional } from 'class-validator';
import {
  MandatoryBigIntField,
  OptionalBigIntField,
} from '../../common/dto/bigint.decorator';
import { NullableStringField } from '../../common/dto/nullable-fields.decorator';

export class CreateMedicineSaltDto {
  @MandatoryBigIntField()
  saltCompositionId!: bigint;

  @IsInt()
  @Min(1)
  sequenceNo!: number;

  @NullableStringField()
  percentage?: string | null;
}

export class UpdateMedicineSaltDto {
  @MandatoryBigIntField()
  version!: bigint;

  @OptionalBigIntField()
  saltCompositionId?: bigint;

  @IsOptional()
  @IsInt()
  @Min(1)
  sequenceNo?: number;

  @NullableStringField()
  percentage?: string | null;
}
