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
  version: number;
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
  version: number;
  countryId?: string;
  stateCode?: string;
  stateName?: string;
  gstStateCode?: string;
  isoCode?: string;
  isActive?: boolean;
}
