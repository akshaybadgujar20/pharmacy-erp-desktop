import { IsInt, Min } from 'class-validator';

export class RetryOutboxDto {
  @IsInt()
  @Min(1)
  version!: number;
}
