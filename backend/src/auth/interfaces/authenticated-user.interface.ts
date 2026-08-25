export interface AuthenticatedUser {
  userId: bigint;
  sessionUuid: string;
  companyId: bigint;
  branchId: bigint;
  roles: string[];
  permissions: string[];
  username: string;
}
