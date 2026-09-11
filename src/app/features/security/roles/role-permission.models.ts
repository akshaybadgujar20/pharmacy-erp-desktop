export interface RolePermission {
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

export interface CreateRolePermissionRequest {
  permissionId: string;
  isGranted?: boolean;
}

export interface UpdateRolePermissionRequest {
  version: number;
  isGranted?: boolean;
}
