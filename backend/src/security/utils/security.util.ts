import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import type { TxClient } from '../../persistence/prisma/prisma-tx.type';

export function serializeBigInt(
  value: bigint | null | undefined,
): string | null {
  return value != null ? value.toString() : null;
}

export function serializeDecimal(
  value: Prisma.Decimal | null | undefined,
): number | null {
  return value != null ? value.toNumber() : null;
}

export function serializeDate(value: Date | null | undefined): string | null {
  return value != null ? value.toISOString() : null;
}

export function optimisticUpdate<T extends { count: number }>(
  result: T,
  id: bigint,
  message = 'Entity version conflict or not found',
): void {
  if (result.count === 0) {
    throw new ApplicationException(
      ErrorCode.ENTITY_VERSION_CONFLICT,
      message,
      HttpStatus.CONFLICT,
      { id: id.toString() },
    );
  }
}

export function throwNotFound(
  code: string,
  message: string,
  details?: Record<string, string>,
): never {
  throw new ApplicationException(code, message, HttpStatus.NOT_FOUND, details);
}

export function throwConflict(
  code: string,
  message: string,
  details?: Record<string, string>,
): never {
  throw new ApplicationException(code, message, HttpStatus.CONFLICT, details);
}

export async function assertUserExists(
  tx: TxClient,
  userId: bigint,
): Promise<{ id: bigint; uuid: string }> {
  const user = await tx.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true, uuid: true },
  });

  if (!user) {
    throwNotFound(ErrorCode.USER_NOT_FOUND, `User not found: ${userId}`, {
      userId: userId.toString(),
    });
  }

  return user;
}

export async function assertRoleExists(
  tx: TxClient,
  roleId: bigint,
): Promise<{ id: bigint; uuid: string }> {
  const role = await tx.role.findFirst({
    where: { id: roleId, deletedAt: null },
    select: { id: true, uuid: true },
  });

  if (!role) {
    throwNotFound(ErrorCode.ROLE_NOT_FOUND, `Role not found: ${roleId}`, {
      roleId: roleId.toString(),
    });
  }

  return role;
}

export async function assertPermissionExists(
  tx: TxClient,
  permissionId: bigint,
): Promise<{ id: bigint; uuid: string }> {
  const permission = await tx.permission.findFirst({
    where: { id: permissionId, deletedAt: null },
    select: { id: true, uuid: true },
  });

  if (!permission) {
    throwNotFound(
      ErrorCode.PERMISSION_NOT_FOUND,
      `Permission not found: ${permissionId}`,
      { permissionId: permissionId.toString() },
    );
  }

  return permission;
}

export async function assertUsernameUnique(
  tx: TxClient,
  username: string,
  excludeUserId?: bigint,
): Promise<void> {
  const existing = await tx.user.findFirst({
    where: {
      username,
      deletedAt: null,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throwConflict(
      ErrorCode.USERNAME_ALREADY_EXISTS,
      `Username already exists: ${username}`,
      { username },
    );
  }
}

export async function assertEmployeeAvailableForUser(
  tx: TxClient,
  employeeId: bigint,
): Promise<void> {
  const employee = await tx.employee.findFirst({
    where: { id: employeeId, deletedAt: null },
    select: { id: true },
  });

  if (!employee) {
    throwNotFound(
      ErrorCode.EMPLOYEE_NOT_FOUND,
      `Employee not found: ${employeeId}`,
      { employeeId: employeeId.toString() },
    );
  }

  const existingUser = await tx.user.findFirst({
    where: { employeeId, deletedAt: null },
    select: { id: true },
  });

  if (existingUser) {
    throwConflict(
      ErrorCode.EMPLOYEE_ALREADY_HAS_USER,
      `Employee already has a user account: ${employeeId}`,
      { employeeId: employeeId.toString() },
    );
  }
}
