export interface UserSession {
  id: string;
  uuid: string;
  userId: string;
  companyId: string;
  branchId: string;
  deviceName: string | null;
  deviceType: string | null;
  operatingSystem: string | null;
  applicationVersion: string | null;
  ipAddress: string | null;
  loginTime: string;
  lastActivityAt: string;
  logoutTime: string | null;
  expiresAt: string;
  isActive: boolean;
  logoutReason: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
}
