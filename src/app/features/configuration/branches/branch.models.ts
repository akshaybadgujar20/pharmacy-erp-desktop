export interface Branch {
  id: string;
  uuid: string;
  companyId: string;
  branchCode: string;
  branchName: string;
  displayName: string;
  gstNumber: string | null;
  drugLicenseNumber: string | null;
  email: string | null;
  phoneNumber: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pinCode: string | null;
  managerName: string | null;
  openingDate: string | null;
  isHeadOffice: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: string;
}

export interface CreateBranchRequest {
  branchCode: string;
  branchName: string;
  displayName: string;
  gstNumber?: string;
  drugLicenseNumber?: string;
  email?: string;
  phoneNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
  managerName?: string;
  openingDate?: string;
  isHeadOffice?: boolean;
  isActive?: boolean;
}

export interface UpdateBranchRequest {
  version: string;
  branchCode?: string;
  branchName?: string;
  displayName?: string;
  gstNumber?: string;
  drugLicenseNumber?: string;
  email?: string;
  phoneNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
  managerName?: string;
  openingDate?: string;
  isHeadOffice?: boolean;
  isActive?: boolean;
}
