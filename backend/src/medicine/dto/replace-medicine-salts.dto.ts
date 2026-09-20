import { Type } from 'class-transformer';
import {
  IsInt,
  Min,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';
import { NullableStringField } from '../../common/dto/nullable-fields.decorator';

export class ReplaceMedicineSaltItemDto {
  @MandatoryBigIntField()
  saltCompositionId!: bigint;

  @IsInt()
  @Min(1)
  sequenceNo!: number;

  @NullableStringField()
  percentage?: string | null;
}

export class ReplaceMedicineSaltsDto {
  @IsOptional()
  @IsBoolean()
  confirmClear?: boolean;

  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => ReplaceMedicineSaltItemDto)
  items!: ReplaceMedicineSaltItemDto[];
}
