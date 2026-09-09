import { IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ManufacturerListQueryDto extends PaginationQueryDto {
  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  isPreferred?: boolean;
}
