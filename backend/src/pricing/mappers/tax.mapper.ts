import { Tax } from '@prisma/client';
import { serializeDecimal, serializeEpochMs } from '../utils/pricing.util';

export interface TaxResponse {
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
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
}

export function toTaxResponse(tax: Tax): TaxResponse {
  return {
    id: tax.id.toString(),
    uuid: tax.uuid,
    taxCode: tax.taxCode,
    taxName: tax.taxName,
    taxType: tax.taxType,
    taxRate: serializeDecimal(tax.taxRate) ?? '0',
    effectiveFrom: serializeEpochMs(tax.effectiveFrom) ?? '',
    effectiveTo: serializeEpochMs(tax.effectiveTo),
    isActive: tax.isActive,
    description: tax.description,
    createdAt: serializeEpochMs(tax.createdAt) ?? '',
    updatedAt: serializeEpochMs(tax.updatedAt) ?? '',
    deletedAt: serializeEpochMs(tax.deletedAt),
    version: tax.version,
  };
}
