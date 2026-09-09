import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { OptionalBigIntField } from '../../common/dto/bigint.decorator';

export class CreateBranchDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  branchCode!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  branchName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  displayName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  gstNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  drugLicenseNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  pinCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  managerName?: string;

  @IsOptional()
  @OptionalBigIntField()
  openingDate?: bigint;

  @IsOptional()
  @IsBoolean()
  isHeadOffice?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
