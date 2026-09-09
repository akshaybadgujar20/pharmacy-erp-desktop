import { DiscountRule } from '@prisma/client';
import {
  serializeDecimal,
  serializeEpochMs,
  serializeOptionalBigInt,
} from '../utils/pricing.util';

export interface DiscountRuleResponse {
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
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
}

export function toDiscountRuleResponse(
  rule: DiscountRule,
): DiscountRuleResponse {
  return {
    id: rule.id.toString(),
    uuid: rule.uuid,
    ruleCode: rule.ruleCode,
    ruleName: rule.ruleName,
    discountType: rule.discountType,
    discountValue: serializeDecimal(rule.discountValue) ?? '0',
    appliesTo: rule.appliesTo,
    medicineId: serializeOptionalBigInt(rule.medicineId),
    categoryId: serializeOptionalBigInt(rule.categoryId),
    customerId: serializeOptionalBigInt(rule.customerId),
    priceListId: serializeOptionalBigInt(rule.priceListId),
    minimumQuantity: serializeDecimal(rule.minimumQuantity),
    minimumAmount: serializeDecimal(rule.minimumAmount),
    priority: rule.priority,
    effectiveFrom: serializeEpochMs(rule.effectiveFrom) ?? '',
    effectiveTo: serializeEpochMs(rule.effectiveTo),
    isActive: rule.isActive,
    remarks: rule.remarks,
    createdAt: serializeEpochMs(rule.createdAt) ?? '',
    updatedAt: serializeEpochMs(rule.updatedAt) ?? '',
    deletedAt: serializeEpochMs(rule.deletedAt),
    version: rule.version,
  };
}
