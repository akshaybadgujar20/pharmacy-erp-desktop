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
  version: number;
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
  version: number;
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
