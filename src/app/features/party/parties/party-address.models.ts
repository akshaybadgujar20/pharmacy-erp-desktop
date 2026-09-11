export interface PartyAddress {
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
  version: number;
}

export interface CreatePartyAddressRequest {
  addressType: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  area?: string;
  cityId?: string;
  stateId?: string;
  countryId?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface UpdatePartyAddressRequest {
  version: number;
  addressType?: string;
  addressLine1?: string;
  addressLine2?: string;
  landmark?: string;
  area?: string;
  cityId?: string;
  stateId?: string;
  countryId?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
  isActive?: boolean;
}
