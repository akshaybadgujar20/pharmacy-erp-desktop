import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReconcileStockTakeDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}
