import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { PartyRoleType } from '../constants/inventory.constants';

export class CreateStockTransferItemDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(Object.values(PartyRoleType))
  roleType!: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
