export const DISCOUNT_TYPE_OPTIONS = [
  { label: 'Percent', value: 'PERCENT' },
  { label: 'Flat', value: 'FLAT' },
];

export const DISCOUNT_APPLIES_TO_OPTIONS = [
  { label: 'Medicine', value: 'MEDICINE' },
  { label: 'Category', value: 'CATEGORY' },
  { label: 'Customer', value: 'CUSTOMER' },
  { label: 'Price List', value: 'PRICE_LIST' },
  { label: 'Global', value: 'GLOBAL' },
];

export interface DiscountRule {
  id: string;
  uuid: string;
  ruleCode: string;
  ruleName: string;
  discountType: string;
  discountValue: string;
  appliesTo: string;
  medicineId: string | null;
  categoryId: string | null;
  customerId: string | null;
  priceListId: string | null;
  minimumQuantity: string | null;
  minimumAmount: string | null;
  priority: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  remarks: string | null;
  version: string;
}

export interface CreateDiscountRuleRequest {
  ruleCode: string;
  ruleName: string;
  discountType: string;
  discountValue: string;
  appliesTo: string;
  medicineId?: string;
  categoryId?: string;
  customerId?: string;
  priceListId?: string;
  minimumQuantity?: string;
  minimumAmount?: string;
  priority: number;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive?: boolean;
  remarks?: string;
}

export interface UpdateDiscountRuleRequest {
  version: string;
  ruleCode?: string;
  ruleName?: string;
  discountType?: string;
  discountValue?: string;
  appliesTo?: string;
  medicineId?: string | null;
  categoryId?: string | null;
  customerId?: string | null;
  priceListId?: string | null;
  minimumQuantity?: string;
  minimumAmount?: string;
  priority?: number;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  isActive?: boolean;
  remarks?: string;
}
