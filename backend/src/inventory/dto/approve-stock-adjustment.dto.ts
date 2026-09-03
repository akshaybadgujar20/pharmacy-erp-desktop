import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ApproveStockAdjustmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}
