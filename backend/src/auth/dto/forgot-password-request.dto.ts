import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ForgotPasswordRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  username!: string;
}
