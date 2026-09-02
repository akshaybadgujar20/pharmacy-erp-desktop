import { IsBoolean, IsOptional } from 'class-validator';

export class CreateStockTransferItemDto {
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
