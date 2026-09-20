export interface UserRole {
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
  version: string;
}

export interface CreateUserRoleRequest {
  roleId: string;
  isActive?: boolean;
}

export interface UpdateUserRoleRequest {
  version: string;
  isActive?: boolean;
}
