import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
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
  @MandatoryBigIntField()
  version!: bigint;

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
