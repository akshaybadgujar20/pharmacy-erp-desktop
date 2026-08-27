import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDoctorDto {
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
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  consultationFee?: number;

  @IsOptional()
  @IsBoolean()
  isVisitingDoctor?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
