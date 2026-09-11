export interface Company {
  id: string;
  uuid: string;
  companyCode: string;
  companyName: string;
  displayName: string;
  gstNumber: string | null;
  panNumber: string | null;
  drugLicenseNumber: string | null;
  email: string | null;
  phoneNumber: string | null;
  website: string | null;
  logoPath: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pinCode: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
}

export interface CreateCompanyRequest {
  companyCode: string;
  companyName: string;
  displayName: string;
  gstNumber?: string;
  panNumber?: string;
  drugLicenseNumber?: string;
  email?: string;
  phoneNumber?: string;
  website?: string;
  logoPath?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface UpdateCompanyRequest {
  version: number;
  companyCode?: string;
  companyName?: string;
  displayName?: string;
  gstNumber?: string;
  panNumber?: string;
  drugLicenseNumber?: string;
  email?: string;
  phoneNumber?: string;
  website?: string;
  logoPath?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
  isDefault?: boolean;
  isActive?: boolean;
}
