export interface User {
  id: string;
  uuid: string;
  employeeId: string;
  username: string;
  passwordChangedAt: string | null;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  lastLoginAt: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: string;
}

export interface CreateUserRequest {
  employeeId: string;
  username: string;
  password: string;
  isActive?: boolean;
  mustChangePassword?: boolean;
}

export interface UpdateUserRequest {
  version: string;
  isActive?: boolean;
  mustChangePassword?: boolean;
}

export interface ResetPasswordRequest {
  newPassword: string;
  mustChangePassword?: boolean;
}
