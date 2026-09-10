import { HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import type { Request } from 'express';
import { AuditService } from '../audit/audit.service';
import { ErrorCode } from '../common/exceptions/error-code';
import { OutboxService } from '../persistence/outbox/outbox.service';
import { UnitOfWorkService } from '../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../prisma.service';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    userSession: {
      create: jest.Mock;
    };
    branch: {
      findFirst: jest.Mock;
    };
    userBranch: {
      findFirst: jest.Mock;
    };
    userRole: { findMany: jest.Mock };
    role: { findMany: jest.Mock };
    rolePermission: { findMany: jest.Mock };
  };
  let passwordService: { verify: jest.Mock };
  let jwtService: { sign: jest.Mock };
  let unitOfWork: { run: jest.Mock };
  let auditService: { log: jest.Mock };
  let outboxService: { enqueue: jest.Mock };

  const mockRequest = {
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
  } as Request;

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      userSession: {
        create: jest.fn(),
      },
      branch: {
        findFirst: jest.fn(),
      },
      userBranch: {
        findFirst: jest.fn(),
      },
      userRole: { findMany: jest.fn() },
      role: { findMany: jest.fn() },
      rolePermission: { findMany: jest.fn() },
    };

    passwordService = {
      verify: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('signed-jwt'),
    };

    unitOfWork = {
      run: jest.fn(async (fn: (tx: typeof prisma) => Promise<unknown>) =>
        fn(prisma),
      ),
    };

    auditService = {
      log: jest.fn(),
    };

    outboxService = {
      enqueue: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: { client: prisma } },
        { provide: PasswordService, useValue: passwordService },
        { provide: JwtService, useValue: jwtService },
        { provide: UnitOfWorkService, useValue: unitOfWork },
        { provide: AuditService, useValue: auditService },
        { provide: OutboxService, useValue: outboxService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('throws AUTH_INVALID_CREDENTIALS for unknown username', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      service.login({ username: 'unknown', password: 'admin123' }, mockRequest),
    ).rejects.toMatchObject({
      code: ErrorCode.AUTH_INVALID_CREDENTIALS,
      statusCode: HttpStatus.UNAUTHORIZED,
    });
  });

  it('throws AUTH_INVALID_CREDENTIALS when lockout is active', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 1n,
      username: 'admin',
      passwordHash: 'hash',
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: new Date(Date.now() + 60_000),
      mustChangePassword: false,
      deletedAt: null,
    });

    await expect(
      service.login({ username: 'admin', password: 'admin123' }, mockRequest),
    ).rejects.toMatchObject({
      code: ErrorCode.AUTH_INVALID_CREDENTIALS,
      statusCode: HttpStatus.UNAUTHORIZED,
    });
  });

  it('returns tokens on successful login', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 1n,
      username: 'admin',
      passwordHash: 'hash',
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      mustChangePassword: false,
      deletedAt: null,
    });
    passwordService.verify.mockResolvedValue(true);
    prisma.userBranch.findFirst.mockResolvedValue({
      branchId: 2n,
      branch: { companyId: 1n, isActive: true, deletedAt: null },
    });
    prisma.userRole.findMany.mockResolvedValue([]);
    prisma.role.findMany.mockResolvedValue([]);
    prisma.rolePermission.findMany.mockResolvedValue([]);
    prisma.userSession.create.mockResolvedValue({
      uuid: 'session-uuid',
      id: 10n,
    });
    prisma.user.update.mockResolvedValue({});

    const result = await service.login(
      { username: 'admin', password: 'admin123' },
      mockRequest,
    );

    expect(result.accessToken).toBe('signed-jwt');
    expect(result.user.username).toBe('admin');
    expect(jwtService.sign).toHaveBeenCalled();
    expect(auditService.log).toHaveBeenCalled();
  });
});
