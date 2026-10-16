import { IsOptional, IsString } from 'class-validator';

export class FefoPreviewQueryDto {
  @IsString()
  medicineId!: string;

  @IsOptional()
  @IsString()
  branchId?: string;
}
