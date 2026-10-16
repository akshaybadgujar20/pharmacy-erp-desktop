import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class MastersImportDto {
  @IsIn(['country', 'state', 'city', 'area'])
  entityType!: 'country' | 'state' | 'city' | 'area';

  @IsString()
  csvText!: string;

  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;
}
