export interface Permission {
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
