import { User } from '@prisma/client';
import { serializeBigInt } from '../utils/security.util';

export interface UserResponse {
  id: string;
  uuid: string;
  employeeId: string;
  username: string;
  passwordChangedAt: string | null;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  lastLoginAt: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
}

export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id.toString(),
    uuid: user.uuid,
    employeeId: user.employeeId.toString(),
    username: user.username,
    passwordChangedAt: serializeBigInt(user.passwordChangedAt),
    failedLoginAttempts: user.failedLoginAttempts,
    lockedUntil: serializeBigInt(user.lockedUntil),
    lastLoginAt: serializeBigInt(user.lastLoginAt),
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
    createdAt: user.createdAt.toString(),
    updatedAt: user.updatedAt.toString(),
    deletedAt: serializeBigInt(user.deletedAt),
    version: user.version,
  };
}
