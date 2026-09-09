import { RolePermission } from '@prisma/client';
import { serializeBigInt } from '../utils/security.util';

export interface RolePermissionResponse {
  id: string;
  uuid: string;
  roleId: string;
  permissionId: string;
  isGranted: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
}

export function toRolePermissionResponse(
  rolePermission: RolePermission,
): RolePermissionResponse {
  return {
    id: rolePermission.id.toString(),
    uuid: rolePermission.uuid,
    roleId: rolePermission.roleId.toString(),
    permissionId: rolePermission.permissionId.toString(),
    isGranted: rolePermission.isGranted,
    createdAt: rolePermission.createdAt.toString(),
    updatedAt: rolePermission.updatedAt.toString(),
    deletedAt: serializeBigInt(rolePermission.deletedAt),
    version: rolePermission.version,
  };
}
