export interface UserBranch {
  id: string;
  uuid: string;
  userId: string;
  branchId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: string;
}

export interface CreateUserBranchRequest {
  branchId: string;
  isActive?: boolean;
}

export interface UpdateUserBranchRequest {
  version: string;
  isActive?: boolean;
}
