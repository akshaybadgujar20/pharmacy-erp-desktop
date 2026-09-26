import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { OptionalBigIntField } from '../../common/dto/bigint.decorator';

const DEVICE_TYPES = ['DESKTOP', 'MOBILE', 'TABLET', 'WEB'] as const;

export class LoginWithPinDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  username!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(6)
  pin!: string;

  @OptionalBigIntField()
  branchId?: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  deviceName?: string;

  @IsOptional()
  @IsString()
  @IsIn(DEVICE_TYPES)
  @MaxLength(50)
  deviceType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  operatingSystem?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  applicationVersion?: string;
}
