import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateUserDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  mustChangePassword?: boolean;
}
