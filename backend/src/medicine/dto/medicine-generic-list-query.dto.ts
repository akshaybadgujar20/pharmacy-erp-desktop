import { IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class MedicineGenericListQueryDto extends PaginationQueryDto {
  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  therapeuticClass?: string;
}
