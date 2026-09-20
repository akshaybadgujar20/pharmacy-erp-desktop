import { Permission } from '@prisma/client';
import { serializeBigInt } from '../utils/security.util';

export interface PermissionResponse {
  id: string;
  uuid: string;
  permissionCode: string;
  permissionName: string;
  module: string;
  resource: string;
  action: string;
  description: string | null;
  isSystemPermission: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: string;
}

export function toPermissionResponse(
  permission: Permission,
): PermissionResponse {
  return {
    id: permission.id.toString(),
    uuid: permission.uuid,
    permissionCode: permission.permissionCode,
    permissionName: permission.permissionName,
    module: permission.module,
    resource: permission.resource,
    action: permission.action,
    description: permission.description,
    isSystemPermission: permission.isSystemPermission,
    isActive: permission.isActive,
    createdAt: permission.createdAt.toString(),
    updatedAt: permission.updatedAt.toString(),
    deletedAt: serializeBigInt(permission.deletedAt),
    version: permission.version.toString(),
  };
}
