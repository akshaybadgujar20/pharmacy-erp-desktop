import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  permissionCode!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  permissionName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  module!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  resource!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  action!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
