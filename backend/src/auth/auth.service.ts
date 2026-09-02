import { randomUUID } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { AuditAction } from '../audit/audit-action.constants';
import { AuditModule } from '../audit/audit-module.constants';
import { AuditService } from '../audit/audit.service';
import { ApplicationException } from '../common/exceptions/application.exception';
import { ErrorCode } from '../common/exceptions/error-code';
import { UnitOfWorkService } from '../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../prisma.service';
import { AUTH_CONSTANTS } from './constants/auth.constants';
import type { LoginDto } from './dto/login.dto';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import type { JwtPayload } from './interfaces/jwt-payload.interface';
import { PasswordService } from './password.service';
import {
  generateRefreshToken,
  hashRefreshToken,
  parseDurationMs,
  safeBigInt,
} from './utils/auth-token.util';

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
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
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

    if (user.lockedUntil && user.lockedUntil > BigInt(Date.now())) {
      throw new ApplicationException(
        ErrorCode.AUTH_INVALID_CREDENTIALS,
        'Invalid username or password',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const passwordValid = await this.passwordService.verify(
      dto.password,
      user.passwordHash,
    );

    if (!passwordValid) {
      await this.recordFailedLogin(user.id);
      await this.auditLoginFailure(user.id, dto.username, 'Invalid password');
      throw new ApplicationException(
        ErrorCode.AUTH_INVALID_CREDENTIALS,
        'Invalid username or password',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (user.mustChangePassword) {
      throw new ApplicationException(
        ErrorCode.AUTH_MUST_CHANGE_PASSWORD,
        'Password change is required before login',
        HttpStatus.FORBIDDEN,
        { userId: user.id.toString() },
      );
    }

    const { companyId, branchId } = await this.resolveTenantScope(
      user.id,
      dto.branchId,
    );
    const { roles, permissions } = await this.loadRolesAndPermissions(user.id);

    const sessionToken = randomUUID();
    const refreshToken = generateRefreshToken();
    const hashedRefreshToken = hashRefreshToken(refreshToken);
    const now = BigInt(Date.now());
    const expiresAt = BigInt(
      new Date(
        new Date().getTime() +
          parseDurationMs(AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY),
      ).getTime(),
    );

    const session = await this.unitOfWork.run(async (tx) => {
      const createdSession = await tx.userSession.create({
        data: {
          userId: user.id,
          companyId,
          branchId,
          sessionToken,
          refreshToken: hashedRefreshToken,
          deviceName: dto.deviceName,
          deviceType: dto.deviceType ?? 'DESKTOP',
          operatingSystem: dto.operatingSystem,
          applicationVersion: dto.applicationVersion,
          ipAddress: req.ip ?? req.socket.remoteAddress,
          loginTime: now,
          lastActivityAt: now,
          expiresAt,
          isActive: true,
          createdAt: BigInt(Date.now()),
          updatedAt: BigInt(Date.now()),
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: now,
        },
      });

      await this.auditService.log(tx, {
        entityType: 'UserSession',
        entityUuid: createdSession.uuid,
        entityId: createdSession.id,
        action: AuditAction.LOGIN,
        module: AuditModule.SECURITY,
        description: `Login success for ${user.username}`,
        userId: user.id,
      });

      return createdSession;
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
    const hashedToken = hashRefreshToken(refreshToken);
    const session = await this.prisma.client.userSession.findFirst({
      where: {
        refreshToken: hashedToken,
        isActive: true,
        deletedAt: null,
      },
      include: { user: true },
    });

    if (!session || session.expiresAt < BigInt(Date.now())) {
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

    if (user.lockedUntil && user.lockedUntil > BigInt(Date.now())) {
      throw new ApplicationException(
        ErrorCode.AUTH_SESSION_EXPIRED,
        'Session is no longer valid',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (user.passwordChangedAt && session.loginTime < user.passwordChangedAt) {
      throw new ApplicationException(
        ErrorCode.AUTH_SESSION_EXPIRED,
        'Session is no longer valid',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (user.mustChangePassword) {
      throw new ApplicationException(
        ErrorCode.AUTH_MUST_CHANGE_PASSWORD,
        'Password change is required',
        HttpStatus.FORBIDDEN,
        { userId: user.id.toString() },
      );
    }

    const { roles, permissions } = await this.loadRolesAndPermissions(user.id);
    const companyId = session.companyId;
    const branchId = session.branchId;

    const newRefreshToken = generateRefreshToken();
    const hashedNewRefreshToken = hashRefreshToken(newRefreshToken);

    const rotated = await this.prisma.client.userSession.updateMany({
      where: {
        id: session.id,
        refreshToken: hashedToken,
        isActive: true,
      },
      data: {
        refreshToken: hashedNewRefreshToken,
        lastActivityAt: BigInt(Date.now()),
      },
    });

    if (rotated.count !== 1) {
      await this.prisma.client.userSession.updateMany({
        where: { id: session.id },
        data: {
          isActive: false,
          logoutTime: BigInt(Date.now()),
          logoutReason: 'TOKEN_REUSE',
        },
      });
      throw new ApplicationException(
        ErrorCode.AUTH_SESSION_EXPIRED,
        'Session has expired. Please log in again.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const payload: JwtPayload = {
      sub: user.id.toString(),
      sessionId: session.uuid,
      companyId: companyId.toString(),
      branchId: branchId.toString(),
      roles,
      permissions,
    };

    const accessToken = this.jwtService.sign(payload);

    await this.unitOfWork.run(async (tx) => {
      await this.auditService.log(tx, {
        entityType: 'UserSession',
        entityUuid: session.uuid,
        entityId: session.id,
        action: AuditAction.LOGIN,
        module: AuditModule.SECURITY,
        description: `Token refresh for ${user.username}`,
        userId: user.id,
      });
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
    const session = await this.prisma.client.userSession.findFirst({
      where: { uuid: sessionUuid, isActive: true },
    });

    if (!session) {
      return;
    }

    await this.unitOfWork.run(async (tx) => {
      await tx.userSession.updateMany({
        where: { uuid: sessionUuid, isActive: true },
        data: {
          isActive: false,
          logoutTime: BigInt(Date.now()),
          logoutReason: 'USER_LOGOUT',
        },
      });

      await this.auditService.log(tx, {
        entityType: 'UserSession',
        entityUuid: sessionUuid,
        entityId: session.id,
        action: AuditAction.LOGOUT,
        module: AuditModule.SECURITY,
        description: 'User logout',
        userId: session.userId,
      });
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
    const userId = safeBigInt(payload.sub);
    if (!userId) {
      return null;
    }

    const session = await this.prisma.client.userSession.findFirst({
      where: {
        uuid: payload.sessionId,
        userId,
        isActive: true,
        deletedAt: null,
      },
      include: { user: true },
    });

    if (!session || session.expiresAt < BigInt(Date.now())) {
      return null;
    }

    const user = session.user;
    if (!user.isActive || user.deletedAt) {
      return null;
    }

    if (user.lockedUntil && user.lockedUntil > BigInt(Date.now())) {
      return null;
    }

    if (user.passwordChangedAt && session.loginTime < user.passwordChangedAt) {
      return null;
    }

    if (user.mustChangePassword) {
      return null;
    }

    const { roles, permissions } = await this.loadRolesAndPermissions(userId);

    return {
      userId,
      sessionUuid: session.uuid,
      companyId: session.companyId,
      branchId: session.branchId,
      roles,
      permissions,
      username: user.username,
    };
  }

  private async auditLoginFailure(
    userId: bigint,
    username: string,
    reason: string,
  ): Promise<void> {
    await this.unitOfWork.run(async (tx) => {
      await this.auditService.log(tx, {
        entityType: 'User',
        entityId: userId,
        action: AuditAction.LOGIN,
        module: AuditModule.SECURITY,
        description: `Login failed for ${username}: ${reason}`,
        userId,
      });
    });
  }

  private async recordFailedLogin(userId: bigint): Promise<void> {
    const updated = await this.prisma.client.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: { increment: 1 } },
    });

    if (
      updated.failedLoginAttempts >= AUTH_CONSTANTS.MAX_FAILED_LOGIN_ATTEMPTS
    ) {
      await this.prisma.client.user.update({
        where: { id: userId },
        data: {
          lockedUntil: BigInt(
            new Date(Date.now() + AUTH_CONSTANTS.LOCKOUT_DURATION_MS).getTime(),
          ),
        },
      });
    }
  }

  private async resolveTenantScope(
    userId: bigint,
    branchId?: bigint,
  ): Promise<{
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

      await this.assertUserCanAccessBranch(userId, branch.id);

      return { companyId: branch.companyId, branchId: branch.id };
    }

    const defaultAssignment = await this.prisma.client.userBranch.findFirst({
      where: { userId, isActive: true, deletedAt: null },
      include: { branch: true },
      orderBy: { branchId: 'asc' },
    });

    if (
      defaultAssignment?.branch.isActive &&
      !defaultAssignment.branch.deletedAt
    ) {
      return {
        companyId: defaultAssignment.branch.companyId,
        branchId: defaultAssignment.branchId,
      };
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

      await this.assertUserCanAccessBranch(userId, fallbackBranch.id);

      return {
        companyId: fallbackBranch.companyId,
        branchId: fallbackBranch.id,
      };
    }

    await this.assertUserCanAccessBranch(userId, defaultBranch.id);

    return {
      companyId: defaultBranch.companyId,
      branchId: defaultBranch.id,
    };
  }

  private async assertUserCanAccessBranch(
    userId: bigint,
    branchId: bigint,
  ): Promise<void> {
    const assignment = await this.prisma.client.userBranch.findFirst({
      where: {
        userId,
        branchId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!assignment) {
      throw new ApplicationException(
        ErrorCode.FORBIDDEN,
        'Branch access denied',
        HttpStatus.FORBIDDEN,
        { branchId: branchId.toString() },
      );
    }
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

    const activeRoleIds = roles.map((role) => role.id);
    if (activeRoleIds.length === 0) {
      return { roles: [], permissions: [] };
    }

    const rolePermissions = await this.prisma.client.rolePermission.findMany({
      where: {
        roleId: { in: activeRoleIds },
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
