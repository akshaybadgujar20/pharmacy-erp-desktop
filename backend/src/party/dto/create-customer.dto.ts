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
import { CustomerType } from '../constants/party.constants';
import { Type } from 'class-transformer';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/)
  partyId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  customerCode!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(Object.values(CustomerType))
  customerType!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  creditLimit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  outstandingAmount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  paymentTermsDays?: number;

  @IsOptional()
  @IsBoolean()
  isTaxExempt?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
