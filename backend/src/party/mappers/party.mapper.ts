import { Party } from '@prisma/client';
import { serializeBigInt } from '../utils/party.util';

export interface PartyResponse {
  id: string;
  uuid: string;
  partyType: string;
  displayName: string;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  organizationName: string | null;
  isActive: boolean;
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  updatedBy: string | null;
  deletedBy: string | null;
  version: number;
}

export function toPartyResponse(party: Party): PartyResponse {
  return {
    id: party.id.toString(),
    uuid: party.uuid,
    partyType: party.partyType,
    displayName: party.displayName,
    firstName: party.firstName,
    middleName: party.middleName,
    lastName: party.lastName,
    organizationName: party.organizationName,
    isActive: party.isActive,
    createdAt: party.createdAt,
    updatedAt: party.updatedAt,
    deletedAt: party.deletedAt,
    updatedBy: serializeBigInt(party.updatedBy),
    deletedBy: serializeBigInt(party.deletedBy),
    version: party.version,
  };
}
