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
  version: string;
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
  version: string;
  contactType?: string;
  contactValue?: string;
  countryCode?: string;
  isPrimary?: boolean;
  isVerified?: boolean;
  isActive?: boolean;
}
