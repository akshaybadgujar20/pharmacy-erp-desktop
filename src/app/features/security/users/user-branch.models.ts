export interface UserBranch {
  id: string;
  uuid: string;
  userId: string;
  branchId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
}

export interface CreateUserBranchRequest {
  branchId: string;
  isActive?: boolean;
}

export interface UpdateUserBranchRequest {
  version: number;
  isActive?: boolean;
}
