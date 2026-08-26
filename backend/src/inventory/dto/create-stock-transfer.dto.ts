import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ContactType } from '../constants/inventory.constants';

export class CreateStockTransferDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(Object.values(ContactType))
  contactType!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @ValidateIf(
    (dto: CreateStockTransferDto) => dto.contactType === ContactType.EMAIL,
  )
  @IsEmail()
  contactValue!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  countryCode?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
