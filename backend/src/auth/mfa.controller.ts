import { Body, Controller, Post } from '@nestjs/common';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { MfaService } from './mfa.service';

class ConfirmMfaDto {
  token!: string;
}

@Controller('auth/mfa')
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  @Post('enroll/start')
  start(@CurrentUser() user: AuthenticatedUser) {
    return this.mfaService.startEnroll(user.userId);
  }

  @Post('enroll/confirm')
  confirm(@CurrentUser() user: AuthenticatedUser, @Body() dto: ConfirmMfaDto) {
    return this.mfaService.confirmEnroll(user.userId, dto.token);
  }
}
