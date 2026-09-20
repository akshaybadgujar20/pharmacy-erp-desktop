import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';
import {
  IsInt,
  Min,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { SupplierType } from '../constants/party.constants';
import { Type } from 'class-transformer';

export class UpdateSupplierDto {
  @MandatoryBigIntField()
  version!: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  supplierCode?: string;

  @IsOptional()
  @IsString()
  @IsIn(Object.values(SupplierType))
  supplierType?: string;

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
