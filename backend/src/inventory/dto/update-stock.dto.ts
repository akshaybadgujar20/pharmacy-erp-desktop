import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateStockDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  doctorCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  registrationNumber?: string;

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
  consultationFee?: string;

  @IsOptional()
  @IsBoolean()
  isVisitingDoctor?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
