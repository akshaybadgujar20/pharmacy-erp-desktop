import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { OptionalBigIntField } from '../../common/dto/bigint.decorator';

export class UpdateStateDto {
  @MandatoryBigIntField()
  version!: bigint;

  @IsOptional()
  @OptionalBigIntField()
  countryId?: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  stateCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  stateName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  gstStateCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  isoCode?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
