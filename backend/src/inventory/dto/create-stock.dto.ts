import { IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';
import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';

export class CreateStockDto {
  @MandatoryBigIntField()
  batchId!: bigint;

  @MandatoryBigIntField()
  branchId!: bigint;

  @IsNumber()
  @Min(0)
  availableQuantity!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  reservedQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  damagedQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  expiredQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  inTransitQuantity?: number;

  @IsOptional()
  @MandatoryBigIntField()
  lastMovementAt?: bigint;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
