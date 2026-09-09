import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';

export class ReplacePrescriptionItemDto {
  @MandatoryBigIntField()
  medicineId!: bigint;

  @MandatoryBigIntField()
  unitId!: bigint;

  @IsInt()
  @Min(1)
  lineNumber!: number;

  @IsString()
  @IsNotEmpty()
  prescribedQuantity!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  dosage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  frequency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  duration?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  route?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class ReplacePrescriptionItemsDto {
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => ReplacePrescriptionItemDto)
  items!: ReplacePrescriptionItemDto[];
}
