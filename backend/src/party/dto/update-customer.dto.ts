import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { CustomerType } from '../constants/party.constants';

export class UpdateCustomerDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  customerCode?: string;

  @IsOptional()
  @IsString()
  @IsIn(Object.values(CustomerType))
  customerType?: string;

  @IsOptional()
  @IsString()
  creditLimit?: string;

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
