export interface RolePermission {
  id: string;
  uuid: string;
  roleId: string;
  permissionId: string;
  isGranted: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: string;
}

export interface CreateRolePermissionRequest {
  permissionId: string;
  isGranted?: boolean;
}

export interface UpdateRolePermissionRequest {
  version: string;
  isGranted?: boolean;
}
