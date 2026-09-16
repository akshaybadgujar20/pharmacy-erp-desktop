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
  version: number;
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
  version: number;
  manufacturerCode?: string;
  manufacturingLicenseNo?: string;
  gstin?: string;
  website?: string;
  email?: string;
  supportPhone?: string;
  isPreferred?: boolean;
  isActive?: boolean;
}
