import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../communication/email/email.service';
import { OutboxService } from '../persistence/outbox/outbox.service';
import { UnitOfWorkService } from '../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../prisma.service';
import { PasswordService } from './password.service';
import { ForgotPasswordService } from './forgot-password.service';

describe('ForgotPasswordService', () => {
  let service: ForgotPasswordService;
  let prisma: {
    user: { findFirst: jest.Mock };
    passwordResetOtp: {
      findFirst: jest.Mock;
      updateMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let passwordService: { hash: jest.Mock; verify: jest.Mock };
  let emailService: { isConfigured: jest.Mock; sendMail: jest.Mock };
  let unitOfWork: { run: jest.Mock };

  const mockRequest = {
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
  } as import('express').Request;

  beforeEach(async () => {
    prisma = {
      user: { findFirst: jest.fn() },
      passwordResetOtp: {
        findFirst: jest.fn(),
        updateMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    passwordService = {
      hash: jest.fn().mockResolvedValue('hashed'),
      verify: jest.fn(),
    };

    emailService = {
      isConfigured: jest.fn().mockReturnValue(false),
      sendMail: jest.fn(),
    };

    unitOfWork = {
      run: jest.fn(async (fn: (tx: typeof prisma) => Promise<unknown>) =>
        fn(prisma),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ForgotPasswordService,
        { provide: PrismaService, useValue: { client: prisma } },
        { provide: PasswordService, useValue: passwordService },
        { provide: EmailService, useValue: emailService },
        { provide: UnitOfWorkService, useValue: unitOfWork },
        { provide: AuditService, useValue: { log: jest.fn() } },
        { provide: OutboxService, useValue: { enqueue: jest.fn() } },
      ],
    }).compile();

    service = module.get(ForgotPasswordService);
  });

  it('requestOtp returns generic message when user is missing', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    const result = await service.requestOtp('unknown', mockRequest);

    expect(result.message).toContain('If an account exists');
    expect(unitOfWork.run).not.toHaveBeenCalled();
  });

  it('confirmReset rejects invalid otp', async () => {
    const user = {
      id: 1n,
      uuid: 'u-1',
      username: 'admin',
      isActive: true,
    };
    prisma.user.findFirst.mockResolvedValue(user);
    prisma.passwordResetOtp.findFirst.mockResolvedValue({
      id: 2n,
      otpHash: 'hash',
      expiresAt: BigInt(Date.now() + 60_000),
      failedAttempts: 0,
    });
    passwordService.verify.mockResolvedValue(false);

    await expect(
      service.confirmReset({
        username: 'admin',
        otp: '123456',
        newPassword: 'newPassword1',
      }),
    ).rejects.toMatchObject({ code: 'AUTH_RESET_OTP_INVALID' });
  });
});
