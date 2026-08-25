import { HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import type { Request } from 'express';
import { ErrorCode } from '../common/exceptions/error-code';
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
    userRole: { findMany: jest.Mock };
    role: { findMany: jest.Mock };
    rolePermission: { findMany: jest.Mock };
  };
  let passwordService: { verify: jest.Mock };
  let jwtService: { sign: jest.Mock };

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: { client: prisma } },
        { provide: PasswordService, useValue: passwordService },
        { provide: JwtService, useValue: jwtService },
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

  it('throws AUTH_ACCOUNT_LOCKED when lockout is active', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 1n,
      username: 'admin',
      passwordHash: 'hash',
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: new Date(Date.now() + 60_000),
      deletedAt: null,
    });

    await expect(
      service.login({ username: 'admin', password: 'admin123' }, mockRequest),
    ).rejects.toMatchObject({
      code: ErrorCode.AUTH_ACCOUNT_LOCKED,
      statusCode: HttpStatus.FORBIDDEN,
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
      deletedAt: null,
    });
    passwordService.verify.mockResolvedValue(true);
    prisma.branch.findFirst.mockResolvedValue({
      id: 2n,
      companyId: 1n,
    });
    prisma.userRole.findMany.mockResolvedValue([]);
    prisma.role.findMany.mockResolvedValue([]);
    prisma.rolePermission.findMany.mockResolvedValue([]);
    prisma.userSession.create.mockResolvedValue({ uuid: 'session-uuid' });
    prisma.user.update.mockResolvedValue({});

    const result = await service.login(
      { username: 'admin', password: 'admin123' },
      mockRequest,
    );

    expect(result.accessToken).toBe('signed-jwt');
    expect(result.user.username).toBe('admin');
    expect(jwtService.sign).toHaveBeenCalled();
  });
});
