import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';

export class CreateSaltCompositionDto {
  @MandatoryBigIntField()
  genericId!: bigint;

  @MandatoryBigIntField()
  unitId!: bigint;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  compositionCode!: string;

  @IsString()
  @IsNotEmpty()
  strength!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  strengthUnit!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
