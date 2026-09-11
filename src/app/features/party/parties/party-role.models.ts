export interface PartyRole {
  id: string;
  partyId: string;
  uuid: string;
  roleType: string;
  isPrimary: boolean;
  isActive: boolean;
  version: number;
}

export interface CreatePartyRoleRequest {
  roleType: string;
  isPrimary?: boolean;
  isActive?: boolean;
}

export interface UpdatePartyRoleRequest {
  version: number;
  roleType?: string;
  isPrimary?: boolean;
  isActive?: boolean;
}
