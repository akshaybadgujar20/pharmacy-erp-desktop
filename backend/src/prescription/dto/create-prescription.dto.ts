import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  MandatoryBigIntField,
  OptionalBigIntField,
} from '../../common/dto/bigint.decorator';

export class CreatePrescriptionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  prescriptionNumber!: string;

  @MandatoryBigIntField()
  customerId!: bigint;

  @MandatoryBigIntField()
  doctorId!: bigint;

  @MandatoryBigIntField()
  prescriptionDate!: bigint;

  @IsOptional()
  @OptionalBigIntField()
  validUntil?: bigint;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsString()
  symptoms?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  visitNumber?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
