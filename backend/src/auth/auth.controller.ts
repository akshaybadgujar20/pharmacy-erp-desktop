import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { Req } from '@nestjs/common';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeRequiredPasswordDto } from './dto/change-required-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { AuthService } from './auth.service';
import { ChangePinDto } from './dto/change-pin.dto';
import { ChangeRequiredPinDto } from './dto/change-required-pin.dto';
import { LoginWithPinDto } from './dto/loginWithPin.dto';
import { CompleteMfaLoginDto } from './dto/complete-mfa-login.dto';
import { ForgotPasswordConfirmDto } from './dto/forgot-password-confirm.dto';
import { ForgotPasswordRequestDto } from './dto/forgot-password-request.dto';
import { ForgotPasswordService } from './forgot-password.service';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly forgotPasswordService: ForgotPasswordService,
  ) {}

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req);
  }

  @Public()
  @Post('login/mfa')
  completeMfaLogin(@Body() dto: CompleteMfaLoginDto, @Req() req: Request) {
    return this.authService.completeMfaLogin(dto, req);
  }

  @Public()
  @Post('login-with-pin')
  loginWithPin(@Body() dto: LoginWithPinDto, @Req() req: Request) {
    return this.authService.loginWithPin(dto, req);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @Post('forgot-password/request')
  forgotPasswordRequest(
    @Body() dto: ForgotPasswordRequestDto,
    @Req() req: Request,
  ) {
    return this.forgotPasswordService.requestOtp(dto.username, req);
  }

  @Public()
  @Post('forgot-password/confirm')
  forgotPasswordConfirm(@Body() dto: ForgotPasswordConfirmDto) {
    return this.forgotPasswordService.confirmReset(dto);
  }

  @Post('logout')
  async logout(@CurrentUser() user: AuthenticatedUser) {
    await this.authService.logout(user.sessionUuid);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getProfile(user);
  }

  @Public()
  @Post('change-required-password')
  changeRequiredPassword(@Body() dto: ChangeRequiredPasswordDto) {
    return this.authService.changeRequiredPassword(dto);
  }

  @Public()
  @Post('change-required-pin')
  changeRequiredPin(@Body() dto: ChangeRequiredPinDto) {
    return this.authService.changeRequiredPin(dto);
  }

  @Post('change-password')
  changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.userId, dto);
  }

  @Post('change-pin')
  changePin(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangePinDto) {
    return this.authService.changePin(user.userId, dto);
  }
}
