import { PartyContact } from '@prisma/client';

export interface PartyContactResponse {
  id: string;
  partyId: string;
  uuid: string;
  contactType: string;
  contactValue: string;
  countryCode: string | null;
  isPrimary: boolean;
  isVerified: boolean;
  isActive: boolean;
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  version: number;
}

export function toPartyContactResponse(
  contact: PartyContact,
): PartyContactResponse {
  return {
    id: contact.id.toString(),
    partyId: contact.partyId.toString(),
    uuid: contact.uuid,
    contactType: contact.contactType,
    contactValue: contact.contactValue,
    countryCode: contact.countryCode,
    isPrimary: contact.isPrimary,
    isVerified: contact.isVerified,
    isActive: contact.isActive,
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt,
    deletedAt: contact.deletedAt,
    version: contact.version,
  };
}
