import { Type } from 'class-transformer';
import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';

export class ReplaceMedicineSaltItemDto {
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
