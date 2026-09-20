export interface State {
  id: string;
  uuid: string;
  countryId: string;
  stateCode: string;
  stateName: string;
  gstStateCode: string | null;
  isoCode: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: string;
}

export interface CreateStateRequest {
  countryId: string;
  stateCode: string;
  stateName: string;
  gstStateCode?: string;
  isoCode?: string;
  isActive?: boolean;
}

export interface UpdateStateRequest {
  version: string;
  countryId?: string;
  stateCode?: string;
  stateName?: string;
  gstStateCode?: string;
  isoCode?: string;
  isActive?: boolean;
}
