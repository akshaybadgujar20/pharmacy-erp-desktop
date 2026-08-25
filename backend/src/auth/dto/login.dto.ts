import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  username!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  password!: string;

  @IsOptional()
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
