import { UserBranch } from '@prisma/client';
import { serializeBigInt } from '../utils/security.util';

export interface UserBranchResponse {
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

export function toUserBranchResponse(
  userBranch: UserBranch,
): UserBranchResponse {
  return {
    id: userBranch.id.toString(),
    uuid: userBranch.uuid,
    userId: userBranch.userId.toString(),
    branchId: userBranch.branchId.toString(),
    isActive: userBranch.isActive,
    createdAt: userBranch.createdAt.toString(),
    updatedAt: userBranch.updatedAt.toString(),
    deletedAt: serializeBigInt(userBranch.deletedAt),
    version: userBranch.version.toString(),
  };
}
