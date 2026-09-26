import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePinDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(6)
  currentPin!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(6)
  newPin!: string;
}
