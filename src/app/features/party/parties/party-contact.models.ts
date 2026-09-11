export interface PartyContact {
  id: string;
  partyId: string;
  uuid: string;
  contactType: string;
  contactValue: string;
  countryCode: string | null;
  isPrimary: boolean;
  isVerified: boolean;
  isActive: boolean;
  version: number;
}

export interface CreatePartyContactRequest {
  contactType: string;
  contactValue: string;
  countryCode?: string;
  isPrimary?: boolean;
  isVerified?: boolean;
  isActive?: boolean;
}

export interface UpdatePartyContactRequest {
  version: number;
  contactType?: string;
  contactValue?: string;
  countryCode?: string;
  isPrimary?: boolean;
  isVerified?: boolean;
  isActive?: boolean;
}
