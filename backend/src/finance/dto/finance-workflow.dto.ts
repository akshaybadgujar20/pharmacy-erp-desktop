import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class FinanceWorkflowDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}
