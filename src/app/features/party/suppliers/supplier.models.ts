export interface Supplier {
  id: string;
  partyId: string;
  uuid: string;
  supplierCode: string;
  supplierType: string;
  gstin: string | null;
  drugLicenseNumber: string | null;
  panNumber: string | null;
  creditLimit: number | null;
  outstandingAmount: number | null;
  paymentTermsDays: number;
  preferredSupplier: boolean;
  isActive: boolean;
  version: number;
}

export interface CreateSupplierRequest {
  partyId: string;
  supplierCode: string;
  supplierType: string;
  gstin?: string;
  drugLicenseNumber?: string;
  panNumber?: string;
  creditLimit?: number;
  paymentTermsDays?: number;
  preferredSupplier?: boolean;
  isActive?: boolean;
}

export interface UpdateSupplierRequest {
  version: number;
  supplierCode?: string;
  supplierType?: string;
  gstin?: string;
  drugLicenseNumber?: string;
  panNumber?: string;
  creditLimit?: number;
  paymentTermsDays?: number;
  preferredSupplier?: boolean;
  isActive?: boolean;
}
