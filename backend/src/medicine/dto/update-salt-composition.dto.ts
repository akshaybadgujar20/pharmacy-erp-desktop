import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { OptionalBigIntField } from '../../common/dto/bigint.decorator';

export class UpdateSaltCompositionDto {
  @MandatoryBigIntField()
  version!: bigint;

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
