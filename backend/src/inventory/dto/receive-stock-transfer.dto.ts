import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReceiveStockTransferDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}
