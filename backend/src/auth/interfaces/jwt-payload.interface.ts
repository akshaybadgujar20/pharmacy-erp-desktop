export interface JwtPayload {
  sub: string;
  sessionId: string;
  companyId: string;
  branchId: string;
  roles: string[];
  permissions: string[];
}
