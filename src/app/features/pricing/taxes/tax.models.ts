export const TAX_TYPE_OPTIONS = [
  { label: 'GST', value: 'GST' },
  { label: 'CGST', value: 'CGST' },
  { label: 'SGST', value: 'SGST' },
  { label: 'IGST', value: 'IGST' },
  { label: 'CESS', value: 'CESS' },
];

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
