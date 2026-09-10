import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  NullableBigIntField,
  OptionalBigIntField,
} from '../../common/dto/bigint.decorator';

export class CreateMedicineCategoryDto {
  @OptionalBigIntField()
  parentCategoryId?: bigint;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  categoryCode!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  categoryName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateMedicineCategoryDto {
  @IsInt()
  @Min(1)
  version!: number;

  @NullableBigIntField()
  parentCategoryId?: bigint | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  categoryCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  categoryName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
