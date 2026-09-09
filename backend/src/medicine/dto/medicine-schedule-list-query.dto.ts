import { IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class MedicineScheduleListQueryDto extends PaginationQueryDto {
  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  requiresPrescription?: boolean;
}
