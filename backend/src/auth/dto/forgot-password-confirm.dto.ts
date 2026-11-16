import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { FORGOT_PASSWORD_CONSTANTS } from '../constants/forgot-password.constants';

export class ForgotPasswordConfirmDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  username!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(new RegExp(`^\\d{${FORGOT_PASSWORD_CONSTANTS.OTP_LENGTH}}$`))
  otp!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;
}
