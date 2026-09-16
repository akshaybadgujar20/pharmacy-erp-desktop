export interface PriceListItem {
  id: string;
  uuid: string;
  priceListId: string;
  medicineId: string;
  sellingPrice: string;
  mrp: string;
  minimumSellingPrice: string | null;
  discountPercent: string | null;
  taxId: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  remarks: string | null;
  version: number;
}

export interface CreatePriceListItemRequest {
  medicineId: string;
  sellingPrice: string;
  mrp: string;
  minimumSellingPrice?: string;
  discountPercent?: string;
  taxId?: string;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive?: boolean;
  remarks?: string;
}

export interface UpdatePriceListItemRequest {
  version: number;
  medicineId?: string;
  sellingPrice?: string;
  mrp?: string;
  minimumSellingPrice?: string;
  discountPercent?: string;
  taxId?: string | null;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  isActive?: boolean;
  remarks?: string;
}
