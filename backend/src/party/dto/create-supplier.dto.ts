import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { SupplierType } from '../constants/party.constants';
import { Type } from 'class-transformer';
import { OptionalBigIntField } from '../../common/dto/bigint.decorator';

export class CreateSupplierDto {
  @OptionalBigIntField()
  partyId!: bigint;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  supplierCode!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(Object.values(SupplierType))
  supplierType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  gstin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  drugLicenseNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  panNumber?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  creditLimit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  paymentTermsDays?: number;

  @IsOptional()
  @IsBoolean()
  preferredSupplier?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
