import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { AddressType } from '../constants/party.constants';

export class CreatePartyAddressDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(Object.values(AddressType))
  addressType!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  addressLine1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  addressLine2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  landmark?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  area?: string;

  @IsOptional()
  @Transform(({ value }: { value: string | undefined }) =>
    value !== undefined && value !== null ? BigInt(value) : undefined,
  )
  cityId?: bigint;

  @IsOptional()
  @Transform(({ value }: { value: string | undefined }) =>
    value !== undefined && value !== null ? BigInt(value) : undefined,
  )
  stateId?: bigint;

  @IsOptional()
  @Transform(({ value }: { value: string | undefined }) =>
    value !== undefined && value !== null ? BigInt(value) : undefined,
  )
  countryId?: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
