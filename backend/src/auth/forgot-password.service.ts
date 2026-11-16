import { randomInt } from 'crypto';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import type { Request } from 'express';
import { AuditAction } from '../audit/audit-action.constants';
import { AuditModule } from '../audit/audit-module.constants';
import { AuditService } from '../audit/audit.service';
import { ApplicationException } from '../common/exceptions/application.exception';
import { ErrorCode } from '../common/exceptions/error-code';
import { EmailService } from '../communication/email/email.service';
import { OutboxService } from '../persistence/outbox/outbox.service';
import { OutboxEntityType } from '../persistence/outbox/entity-type.constants';
import { OutboxOperation } from '../persistence/outbox/outbox-operation.constants';
import { UnitOfWorkService } from '../persistence/unit-of-work/unit-of-work.service';
import { ContactType } from '../party/constants/party.constants';
import { PrismaService } from '../prisma.service';
import { LogoutReason } from '../persistence/user-session/logout-reason.constants';
import { invalidateUserSessions } from '../persistence/user-session/session.util';
import { FORGOT_PASSWORD_CONSTANTS } from './constants/forgot-password.constants';
import type { ForgotPasswordConfirmDto } from './dto/forgot-password-confirm.dto';
import { PasswordService } from './password.service';

@Injectable()
export class ForgotPasswordService {
  private readonly logger = new Logger(ForgotPasswordService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly emailService: EmailService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
  ) {}

  async requestOtp(
    username: string,
    req: Request,
  ): Promise<{ message: string }> {
    const user = await this.prisma.client.user.findFirst({
      where: { username, deletedAt: null, isActive: true },
      include: {
        employee: {
          include: {
            party: {
              include: {
                contacts: {
                  where: {
                    contactType: ContactType.EMAIL,
                    isActive: true,
                    deletedAt: null,
                  },
                },
              },
            },
          },
        },
      },
    });

    const message = FORGOT_PASSWORD_CONSTANTS.GENERIC_SUCCESS_MESSAGE;

    if (!user) {
      return { message };
    }

    const email = this.resolvePrimaryEmail(
      user.employee?.party?.contacts ?? [],
    );
    if (!email) {
      this.logger.debug(
        `Password reset requested for ${username} but no email contact found`,
      );
      return { message };
    }

    const now = BigInt(Date.now());
    const latest = await this.prisma.client.passwordResetOtp.findFirst({
      where: { userId: user.id, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (
      latest &&
      latest.createdAt >
        now - BigInt(FORGOT_PASSWORD_CONSTANTS.MIN_REQUEST_INTERVAL_MS)
    ) {
      return { message };
    }

    const otpMin = 10 ** (FORGOT_PASSWORD_CONSTANTS.OTP_LENGTH - 1);
    const otpMax = 10 ** FORGOT_PASSWORD_CONSTANTS.OTP_LENGTH;
    const otp = String(randomInt(otpMin, otpMax));
    const otpHash = await this.passwordService.hash(otp);
    const expiresAt = now + BigInt(FORGOT_PASSWORD_CONSTANTS.OTP_TTL_MS);

    await this.unitOfWork.run(async (tx) => {
      await tx.passwordResetOtp.updateMany({
        where: { userId: user.id, consumedAt: null },
        data: { consumedAt: now },
      });

      await tx.passwordResetOtp.create({
        data: {
          userId: user.id,
          otpHash,
          expiresAt,
          requestIp: req.ip ?? req.socket.remoteAddress ?? null,
          createdAt: now,
        },
      });

      await this.auditService.log(tx, {
        entityType: 'User',
        entityId: user.id,
        entityUuid: user.uuid,
        action: AuditAction.UPDATE,
        module: AuditModule.SECURITY,
        description: `Password reset OTP requested for ${user.username}`,
        userId: user.id,
      });
    });

    if (this.emailService.isConfigured()) {
      try {
        await this.emailService.sendMail({
          to: email,
          subject: 'Pharmacy ERP password reset code',
          text: `Your verification code is ${otp}. It expires in 10 minutes.`,
          html: `<p>Your verification code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
        });
      } catch (error) {
        this.logger.error(
          `Failed to send password reset email for ${username}`,
          error,
        );
      }
    } else {
      this.logger.warn(
        `SMTP not configured; OTP for ${username} was stored but not emailed`,
      );
    }

    return { message };
  }

  async confirmReset(
    dto: ForgotPasswordConfirmDto,
  ): Promise<{ message: string }> {
    const user = await this.prisma.client.user.findFirst({
      where: { username: dto.username, deletedAt: null, isActive: true },
    });

    if (!user) {
      throw new ApplicationException(
        ErrorCode.AUTH_RESET_OTP_INVALID,
        'Invalid verification code',
        HttpStatus.BAD_REQUEST,
      );
    }

    const otpRow = await this.prisma.client.passwordResetOtp.findFirst({
      where: { userId: user.id, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRow || otpRow.expiresAt < BigInt(Date.now())) {
      throw new ApplicationException(
        ErrorCode.AUTH_RESET_OTP_EXPIRED,
        'Verification code has expired. Request a new code.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      otpRow.failedAttempts >= FORGOT_PASSWORD_CONSTANTS.MAX_VERIFY_ATTEMPTS
    ) {
      throw new ApplicationException(
        ErrorCode.AUTH_RESET_OTP_INVALID,
        'Too many invalid attempts. Request a new code.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const otpValid = await this.passwordService.verify(dto.otp, otpRow.otpHash);

    if (!otpValid) {
      await this.prisma.client.passwordResetOtp.update({
        where: { id: otpRow.id },
        data: { failedAttempts: { increment: 1 } },
      });
      throw new ApplicationException(
        ErrorCode.AUTH_RESET_OTP_INVALID,
        'Invalid verification code',
        HttpStatus.BAD_REQUEST,
      );
    }

    const passwordHash = await this.passwordService.hash(dto.newPassword);
    const now = BigInt(Date.now());

    return this.unitOfWork.run(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordChangedAt: now,
          mustChangePassword: false,
          mustChangePin: true,
          failedLoginAttempts: 0,
          lockedUntil: null,
          updatedAt: now,
          version: { increment: 1 },
        },
      });

      await tx.passwordResetOtp.update({
        where: { id: otpRow.id },
        data: { consumedAt: now },
      });

      await invalidateUserSessions(tx, user.id, LogoutReason.PASSWORD_CHANGED);

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.USER,
        entityId: updatedUser.id,
        entityUuid: updatedUser.uuid,
        action: AuditAction.UPDATE,
        module: AuditModule.SECURITY,
        description: `Password reset via OTP for ${updatedUser.username}`,
        userId: user.id,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.USER,
        entityUuid: updatedUser.uuid,
        operation: OutboxOperation.UPDATE,
        operationId: `password-reset-otp:${updatedUser.uuid}:${now.toString()}`,
        payload: {
          uuid: updatedUser.uuid,
          username: updatedUser.username,
        },
      });

      return { message: 'Password has been reset successfully' };
    });
  }

  private resolvePrimaryEmail(
    contacts: { contactValue: string; isPrimary: boolean }[],
  ): string | null {
    if (contacts.length === 0) {
      return null;
    }
    const sorted = [...contacts].sort(
      (a, b) => Number(b.isPrimary) - Number(a.isPrimary),
    );
    return sorted[0]?.contactValue ?? null;
  }
}
