import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DispatchStockTransferDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}
