import {
  IsInt,
  Min,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';

export class CreatePrescriptionItemDto {
  @MandatoryBigIntField()
  medicineId!: bigint;

  @MandatoryBigIntField()
  unitId!: bigint;

  @IsInt()
  @Min(1)
  lineNumber!: number;

  @IsString()
  @IsNotEmpty()
  prescribedQuantity!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  dosage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  frequency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  duration?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  route?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdatePrescriptionItemDto {
  @MandatoryBigIntField()
  version!: bigint;

  @IsOptional()
  @MandatoryBigIntField()
  medicineId?: bigint;

  @IsOptional()
  @MandatoryBigIntField()
  unitId?: bigint;

  @IsOptional()
  @IsInt()
  @Min(1)
  lineNumber?: number;

  @IsOptional()
  @IsString()
  prescribedQuantity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  dosage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  frequency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  duration?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  route?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
