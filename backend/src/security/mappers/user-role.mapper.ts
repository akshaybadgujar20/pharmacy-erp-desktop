import { UserRole } from '@prisma/client';
import { serializeBigInt } from '../utils/security.util';

export interface UserRoleResponse {
  id: string;
  uuid: string;
  userId: string;
  roleId: string;
  assignedAt: string;
  assignedByUserId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
}

export function toUserRoleResponse(userRole: UserRole): UserRoleResponse {
  return {
    id: userRole.id.toString(),
    uuid: userRole.uuid,
    userId: userRole.userId.toString(),
    roleId: userRole.roleId.toString(),
    assignedAt: userRole.assignedAt.toString(),
    assignedByUserId: serializeBigInt(userRole.assignedByUserId),
    isActive: userRole.isActive,
    createdAt: userRole.createdAt.toString(),
    updatedAt: userRole.updatedAt.toString(),
    deletedAt: serializeBigInt(userRole.deletedAt),
    version: userRole.version,
  };
}
