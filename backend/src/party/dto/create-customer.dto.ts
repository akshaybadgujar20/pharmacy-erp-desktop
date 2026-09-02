import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { CustomerType } from '../constants/party.constants';
import { Type } from 'class-transformer';
import { OptionalBigIntField } from '../../common/dto/bigint.decorator';

export class CreateCustomerDto {
  @OptionalBigIntField()
  partyId!: bigint;

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
