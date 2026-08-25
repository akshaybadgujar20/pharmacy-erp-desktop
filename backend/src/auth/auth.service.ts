import { randomUUID } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { ApplicationException } from '../common/exceptions/application.exception';
import { ErrorCode } from '../common/exceptions/error-code';
import { PrismaService } from '../prisma.service';
import { AUTH_CONSTANTS } from './constants/auth.constants';
import type { LoginDto } from './dto/login.dto';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import type { JwtPayload } from './interfaces/jwt-payload.interface';
import { PasswordService } from './password.service';

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: {
    id: string;
    username: string;
    roles: string[];
    permissions: string[];
    companyId: string;
    branchId: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
  ) {}

  async login(dto: LoginDto, req: Request): Promise<AuthTokenResponse> {
    const user = await this.prisma.client.user.findFirst({
      where: {
        username: dto.username,
        deletedAt: null,
      },
    });

    if (!user || !user.isActive) {
      throw new ApplicationException(
        ErrorCode.AUTH_INVALID_CREDENTIALS,
        'Invalid username or password',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ApplicationException(
        ErrorCode.AUTH_ACCOUNT_LOCKED,
        'Account is temporarily locked due to failed login attempts',
        HttpStatus.FORBIDDEN,
        { lockedUntil: user.lockedUntil.toISOString() },
      );
    }

    const passwordValid = await this.passwordService.verify(
      dto.password,
      user.passwordHash,
    );

    if (!passwordValid) {
      await this.recordFailedLogin(user.id, user.failedLoginAttempts);
      throw new ApplicationException(
        ErrorCode.AUTH_INVALID_CREDENTIALS,
        'Invalid username or password',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const { companyId, branchId } = await this.resolveTenantScope(dto.branchId);
    const { roles, permissions } = await this.loadRolesAndPermissions(user.id);

    const sessionToken = randomUUID();
    const refreshToken = randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const session = await this.prisma.client.userSession.create({
      data: {
        userId: user.id,
        sessionToken,
        refreshToken,
        deviceName: dto.deviceName,
        deviceType: dto.deviceType ?? 'DESKTOP',
        operatingSystem: dto.operatingSystem,
        applicationVersion: dto.applicationVersion,
        ipAddress: req.ip ?? req.socket.remoteAddress,
        loginTime: now,
        lastActivityAt: now,
        expiresAt,
        isActive: true,
      },
    });

    await this.prisma.client.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: now,
      },
    });

    const payload: JwtPayload = {
      sub: user.id.toString(),
      sessionId: session.uuid,
      companyId: companyId.toString(),
      branchId: branchId.toString(),
      roles,
      permissions,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      refreshToken,
      expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY,
      user: {
        id: user.id.toString(),
        username: user.username,
        roles,
        permissions,
        companyId: companyId.toString(),
        branchId: branchId.toString(),
      },
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokenResponse> {
    const session = await this.prisma.client.userSession.findFirst({
      where: {
        refreshToken,
        isActive: true,
        deletedAt: null,
      },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new ApplicationException(
        ErrorCode.AUTH_SESSION_EXPIRED,
        'Session has expired. Please log in again.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user = session.user;
    if (!user.isActive || user.deletedAt) {
      throw new ApplicationException(
        ErrorCode.AUTH_SESSION_EXPIRED,
        'Session is no longer valid',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const { roles, permissions } = await this.loadRolesAndPermissions(user.id);
    const branch = await this.prisma.client.branch.findFirst({
      where: { isActive: true, deletedAt: null, isHeadOffice: true },
      orderBy: { id: 'asc' },
    });

    const branchId = branch?.id ?? 1n;
    const companyId = branch?.companyId ?? 1n;

    const payload: JwtPayload = {
      sub: user.id.toString(),
      sessionId: session.uuid,
      companyId: companyId.toString(),
      branchId: branchId.toString(),
      roles,
      permissions,
    };

    const accessToken = this.jwtService.sign(payload);
    const newRefreshToken = randomUUID();

    await this.prisma.client.userSession.update({
      where: { id: session.id },
      data: {
        refreshToken: newRefreshToken,
        lastActivityAt: new Date(),
      },
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY,
      user: {
        id: user.id.toString(),
        username: user.username,
        roles,
        permissions,
        companyId: companyId.toString(),
        branchId: branchId.toString(),
      },
    };
  }

  async logout(sessionUuid: string): Promise<void> {
    await this.prisma.client.userSession.updateMany({
      where: { uuid: sessionUuid, isActive: true },
      data: {
        isActive: false,
        logoutTime: new Date(),
        logoutReason: 'USER_LOGOUT',
      },
    });
  }

  getProfile(user: AuthenticatedUser) {
    return {
      id: user.userId.toString(),
      username: user.username,
      roles: user.roles,
      permissions: user.permissions,
      companyId: user.companyId.toString(),
      branchId: user.branchId.toString(),
    };
  }

  async validateSession(
    payload: JwtPayload,
  ): Promise<AuthenticatedUser | null> {
    const userId = BigInt(payload.sub);
    const session = await this.prisma.client.userSession.findFirst({
      where: {
        uuid: payload.sessionId,
        userId,
        isActive: true,
        deletedAt: null,
      },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    const user = session.user;
    if (!user.isActive || user.deletedAt) {
      return null;
    }

    return {
      userId,
      sessionUuid: session.uuid,
      companyId: BigInt(payload.companyId),
      branchId: BigInt(payload.branchId),
      roles: payload.roles,
      permissions: payload.permissions,
      username: user.username,
    };
  }

  private async recordFailedLogin(
    userId: bigint,
    currentAttempts: number,
  ): Promise<void> {
    const attempts = currentAttempts + 1;
    const shouldLock = attempts >= AUTH_CONSTANTS.MAX_FAILED_LOGIN_ATTEMPTS;

    await this.prisma.client.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil: shouldLock
          ? new Date(Date.now() + AUTH_CONSTANTS.LOCKOUT_DURATION_MS)
          : undefined,
      },
    });
  }

  private async resolveTenantScope(branchId?: bigint): Promise<{
    companyId: bigint;
    branchId: bigint;
  }> {
    if (branchId) {
      const branch = await this.prisma.client.branch.findFirst({
        where: { id: branchId, isActive: true, deletedAt: null },
      });

      if (!branch) {
        throw new ApplicationException(
          ErrorCode.NOT_FOUND,
          'Branch not found',
          HttpStatus.NOT_FOUND,
          { branchId: branchId.toString() },
        );
      }

      return { companyId: branch.companyId, branchId: branch.id };
    }

    const defaultBranch = await this.prisma.client.branch.findFirst({
      where: { isActive: true, deletedAt: null, isHeadOffice: true },
      orderBy: { id: 'asc' },
    });

    if (!defaultBranch) {
      const fallbackBranch = await this.prisma.client.branch.findFirst({
        where: { isActive: true, deletedAt: null },
        orderBy: { id: 'asc' },
      });

      if (!fallbackBranch) {
        throw new ApplicationException(
          ErrorCode.NOT_FOUND,
          'No active branch configured',
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        companyId: fallbackBranch.companyId,
        branchId: fallbackBranch.id,
      };
    }

    return {
      companyId: defaultBranch.companyId,
      branchId: defaultBranch.id,
    };
  }

  private async loadRolesAndPermissions(userId: bigint): Promise<{
    roles: string[];
    permissions: string[];
  }> {
    const userRoles = await this.prisma.client.userRole.findMany({
      where: { userId, isActive: true, deletedAt: null },
    });

    const roleIds = userRoles.map((userRole) => userRole.roleId);
    if (roleIds.length === 0) {
      return { roles: [], permissions: [] };
    }

    const roles = await this.prisma.client.role.findMany({
      where: {
        id: { in: roleIds },
        isActive: true,
        deletedAt: null,
      },
    });

    const rolePermissions = await this.prisma.client.rolePermission.findMany({
      where: {
        roleId: { in: roleIds },
        isGranted: true,
        deletedAt: null,
      },
      include: { permission: true },
    });

    const permissions = rolePermissions
      .filter((rp) => rp.permission.isActive && !rp.permission.deletedAt)
      .map(
        (rp) =>
          `${rp.permission.module}:${rp.permission.resource}:${rp.permission.action}`,
      );

    return {
      roles: roles.map((role) => role.roleCode),
      permissions: [...new Set(permissions)] as string[],
    };
  }
}
