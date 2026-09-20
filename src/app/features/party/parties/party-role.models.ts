export interface PartyRole {
  id: string;
  partyId: string;
  uuid: string;
  roleType: string;
  isPrimary: boolean;
  isActive: boolean;
  version: string;
}

export interface CreatePartyRoleRequest {
  roleType: string;
  isPrimary?: boolean;
  isActive?: boolean;
}

export interface UpdatePartyRoleRequest {
  version: string;
  roleType?: string;
  isPrimary?: boolean;
  isActive?: boolean;
}
