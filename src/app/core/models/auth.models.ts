export interface AuthUser {
  id: string;
  username: string;
  roles: string[];
  permissions: string[];
  companyId: string;
  branchId: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: AuthUser;
}

export interface LoginRequest {
  username: string;
  password: string;
  branchId?: string;
  deviceName?: string;
  deviceType?: string;
  operatingSystem?: string;
  applicationVersion?: string;
}
