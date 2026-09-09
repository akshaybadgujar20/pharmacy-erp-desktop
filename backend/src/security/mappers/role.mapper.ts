import { Role } from '@prisma/client';
import { serializeBigInt } from '../utils/security.util';

export interface RoleResponse {
  id: string;
  uuid: string;
  roleCode: string;
  roleName: string;
  description: string | null;
  isSystemRole: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
}

export function toRoleResponse(role: Role): RoleResponse {
  return {
    id: role.id.toString(),
    uuid: role.uuid,
    roleCode: role.roleCode,
    roleName: role.roleName,
    description: role.description,
    isSystemRole: role.isSystemRole,
    isActive: role.isActive,
    createdAt: role.createdAt.toString(),
    updatedAt: role.updatedAt.toString(),
    deletedAt: serializeBigInt(role.deletedAt),
    version: role.version,
  };
}
