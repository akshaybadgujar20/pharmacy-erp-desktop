import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
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
  @IsString()
  percentage?: string;
}

export class ReplaceMedicineSaltsDto {
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => ReplaceMedicineSaltItemDto)
  items!: ReplaceMedicineSaltItemDto[];
}
