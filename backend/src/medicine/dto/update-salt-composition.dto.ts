import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { OptionalBigIntField } from '../../common/dto/bigint.decorator';

export class UpdateSaltCompositionDto {
  @IsInt()
  @Min(1)
  version!: number;

  @OptionalBigIntField()
  genericId?: bigint;

  @OptionalBigIntField()
  unitId?: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  compositionCode?: string;

  @IsOptional()
  @IsString()
  strength?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  strengthUnit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
