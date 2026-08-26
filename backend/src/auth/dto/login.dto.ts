import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const DEVICE_TYPES = ['DESKTOP', 'MOBILE', 'TABLET', 'WEB'] as const;

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  username!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(200)
  password!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+$/, { message: 'branchId must be a numeric string' })
  @Transform(({ value }: { value: string | undefined }) =>
    value !== undefined && value !== null ? BigInt(value) : undefined,
  )
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
