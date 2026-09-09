import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMedicineScheduleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  scheduleCode!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  scheduleName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  requiresPrescription?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresDoctorDetails?: boolean;

  @IsOptional()
  @IsBoolean()
  maintainSalesRegister?: boolean;

  @IsOptional()
  @IsBoolean()
  controlledSubstance?: boolean;

  @IsOptional()
  @IsBoolean()
  isSystemSchedule?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateMedicineScheduleDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  scheduleCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  scheduleName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  requiresPrescription?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresDoctorDetails?: boolean;

  @IsOptional()
  @IsBoolean()
  maintainSalesRegister?: boolean;

  @IsOptional()
  @IsBoolean()
  controlledSubstance?: boolean;

  @IsOptional()
  @IsBoolean()
  isSystemSchedule?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
