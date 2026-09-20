import { PartyRole } from '@prisma/client';

export interface PartyRoleResponse {
  id: string;
  partyId: string;
  uuid: string;
  roleType: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  version: string;
}

export function toPartyRoleResponse(role: PartyRole): PartyRoleResponse {
  return {
    id: role.id.toString(),
    partyId: role.partyId.toString(),
    uuid: role.uuid,
    roleType: role.roleType,
    isPrimary: role.isPrimary,
    isActive: role.isActive,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
    deletedAt: role.deletedAt,
    version: role.version.toString(),
  };
}
