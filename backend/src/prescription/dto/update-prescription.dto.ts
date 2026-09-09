import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { OptionalBigIntField } from '../../common/dto/bigint.decorator';

export class UpdatePrescriptionDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  prescriptionNumber?: string;

  @IsOptional()
  @OptionalBigIntField()
  customerId?: bigint;

  @IsOptional()
  @OptionalBigIntField()
  doctorId?: bigint;

  @IsOptional()
  @OptionalBigIntField()
  prescriptionDate?: bigint;

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
