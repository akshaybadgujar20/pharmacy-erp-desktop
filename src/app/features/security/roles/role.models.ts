export interface Role {
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

export interface CreateRoleRequest {
  roleCode: string;
  roleName: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateRoleRequest {
  version: number;
  roleCode?: string;
  roleName?: string;
  description?: string;
  isActive?: boolean;
}
