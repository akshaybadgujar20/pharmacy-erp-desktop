import { PartyAddress } from '@prisma/client';
import { serializeBigInt, serializeDate } from '../utils/party.util';

export interface PartyAddressResponse {
  id: string;
  partyId: string;
  uuid: string;
  addressType: string;
  addressLine1: string;
  addressLine2: string | null;
  landmark: string | null;
  area: string | null;
  cityId: string | null;
  stateId: string | null;
  countryId: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
}

export function toPartyAddressResponse(
  address: PartyAddress,
): PartyAddressResponse {
  return {
    id: address.id.toString(),
    partyId: address.partyId.toString(),
    uuid: address.uuid,
    addressType: address.addressType,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    landmark: address.landmark,
    area: address.area,
    cityId: serializeBigInt(address.cityId),
    stateId: serializeBigInt(address.stateId),
    countryId: serializeBigInt(address.countryId),
    postalCode: address.postalCode,
    latitude: address.latitude,
    longitude: address.longitude,
    isDefault: address.isDefault,
    isActive: address.isActive,
    createdAt: address.createdAt.toISOString(),
    updatedAt: address.updatedAt.toISOString(),
    deletedAt: serializeDate(address.deletedAt),
    version: address.version,
  };
}
