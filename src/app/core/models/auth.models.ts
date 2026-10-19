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

export interface MfaLoginChallengeResponse {
  mfaRequired: true;
  mfaChallengeToken: string;
}

export function isMfaLoginChallenge(
  value: AuthTokenResponse | MfaLoginChallengeResponse,
): value is MfaLoginChallengeResponse {
  return 'mfaRequired' in value && value.mfaRequired === true;
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

export interface LoginWithPinRequest {
  username: string;
  pin: string;
  branchId?: string;
  deviceName?: string;
  deviceType?: string;
  operatingSystem?: string;
  applicationVersion?: string;
}
