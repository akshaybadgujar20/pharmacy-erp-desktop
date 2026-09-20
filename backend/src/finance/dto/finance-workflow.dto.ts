import { MandatoryBigIntField } from '../../common/dto/bigint.decorator';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class FinanceWorkflowDto {
  @MandatoryBigIntField()
  version!: bigint;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}
