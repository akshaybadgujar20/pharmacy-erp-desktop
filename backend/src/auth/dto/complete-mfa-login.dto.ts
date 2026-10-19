import { IsString, Length } from 'class-validator';
import { LoginDto } from './login.dto';

export class CompleteMfaLoginDto extends LoginDto {
  @IsString()
  mfaChallengeToken!: string;

  @IsString()
  @Length(6, 6)
  totpCode!: string;
}
