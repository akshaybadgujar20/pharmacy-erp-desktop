export interface Tax {
  id: string;
  uuid: string;
  taxCode: string;
  taxName: string;
  taxType: string;
  taxRate: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  description: string | null;
  version: string;
}

export interface CreateTaxRequest {
  taxCode: string;
  taxName: string;
  taxType: string;
  taxRate: string;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive?: boolean;
  description?: string;
}

export interface UpdateTaxRequest {
  version: string;
  taxCode?: string;
  taxName?: string;
  taxType?: string;
  taxRate?: string;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  isActive?: boolean;
  description?: string;
}
