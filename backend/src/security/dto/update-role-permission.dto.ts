import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateRolePermissionDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsOptional()
  @IsBoolean()
  isGranted?: boolean;
}
