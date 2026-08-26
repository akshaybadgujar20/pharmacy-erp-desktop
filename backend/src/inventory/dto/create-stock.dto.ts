import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateStockDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/)
  partyId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  doctorCode!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  registrationNumber!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  qualification?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  specialization?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  hospitalName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  consultationFee?: string;

  @IsOptional()
  @IsBoolean()
  isVisitingDoctor?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
