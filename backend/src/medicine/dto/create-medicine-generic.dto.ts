import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMedicineGenericDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  genericCode!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  genericName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  therapeuticClass?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  pharmacologicalClass?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateMedicineGenericDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  genericCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  genericName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  therapeuticClass?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  pharmacologicalClass?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
