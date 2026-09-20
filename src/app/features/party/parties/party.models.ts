export interface Party {
  id: string;
  uuid: string;
  partyType: string;
  displayName: string;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  organizationName: string | null;
  isActive: boolean;
  version: string;
}

export interface CreatePartyRequest {
  partyType: string;
  displayName: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  organizationName?: string;
  isActive?: boolean;
}

export interface UpdatePartyRequest {
  version: string;
  partyType?: string;
  displayName?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  organizationName?: string;
  isActive?: boolean;
}
