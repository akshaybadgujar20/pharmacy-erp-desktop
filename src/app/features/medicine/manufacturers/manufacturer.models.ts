export interface Manufacturer {
  id: string;
  partyId: string;
  uuid: string;
  manufacturerCode: string;
  manufacturingLicenseNo: string | null;
  gstin: string | null;
  website: string | null;
  email: string | null;
  supportPhone: string | null;
  isPreferred: boolean;
  isActive: boolean;
  version: string;
}

export interface CreateManufacturerRequest {
  partyId: string;
  manufacturerCode: string;
  manufacturingLicenseNo?: string;
  gstin?: string;
  website?: string;
  email?: string;
  supportPhone?: string;
  isPreferred?: boolean;
  isActive?: boolean;
}

export interface UpdateManufacturerRequest {
  version: string;
  manufacturerCode?: string;
  manufacturingLicenseNo?: string;
  gstin?: string;
  website?: string;
  email?: string;
  supportPhone?: string;
  isPreferred?: boolean;
  isActive?: boolean;
}
