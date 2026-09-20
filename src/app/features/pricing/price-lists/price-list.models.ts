export interface PriceList {
  id: string;
  uuid: string;
  priceListCode: string;
  priceListName: string;
  branchId: string | null;
  priceListType: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  isDefault: boolean;
  isActive: boolean;
  remarks: string | null;
  version: string;
}

export interface CreatePriceListRequest {
  priceListCode: string;
  priceListName: string;
  branchId?: string;
  priceListType: string;
  effectiveFrom: string;
  effectiveTo?: string;
  isDefault?: boolean;
  isActive?: boolean;
  remarks?: string;
}

export interface UpdatePriceListRequest {
  version: string;
  priceListCode?: string;
  priceListName?: string;
  branchId?: string | null;
  priceListType?: string;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  isDefault?: boolean;
  isActive?: boolean;
  remarks?: string;
}
