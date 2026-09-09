import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { UnitType } from '../constants/medicine.constants';

export class UnitOfMeasureListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(Object.values(UnitType))
  unitType?: string;

  @IsOptional()
  isActive?: boolean;
}
