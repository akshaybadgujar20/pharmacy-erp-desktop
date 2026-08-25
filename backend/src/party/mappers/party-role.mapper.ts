import { PartyRole } from '@prisma/client';
import { serializeDate } from '../utils/party.util';

export interface PartyRoleResponse {
  id: string;
  partyId: string;
  uuid: string;
  roleType: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
}

export function toPartyRoleResponse(role: PartyRole): PartyRoleResponse {
  return {
    id: role.id.toString(),
    partyId: role.partyId.toString(),
    uuid: role.uuid,
    roleType: role.roleType,
    isPrimary: role.isPrimary,
    isActive: role.isActive,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
    deletedAt: serializeDate(role.deletedAt),
    version: role.version,
  };
}
