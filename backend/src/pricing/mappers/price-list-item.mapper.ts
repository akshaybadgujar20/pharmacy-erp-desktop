import { PriceListItem } from '@prisma/client';
import {
  serializeDecimal,
  serializeEpochMs,
  serializeOptionalBigInt,
} from '../utils/pricing.util';

export interface PriceListItemResponse {
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
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: string;
}

export function toPriceListItemResponse(
  item: PriceListItem,
): PriceListItemResponse {
  return {
    id: item.id.toString(),
    uuid: item.uuid,
    priceListId: item.priceListId.toString(),
    medicineId: item.medicineId.toString(),
    sellingPrice: serializeDecimal(item.sellingPrice) ?? '0',
    mrp: serializeDecimal(item.mrp) ?? '0',
    minimumSellingPrice: serializeDecimal(item.minimumSellingPrice),
    discountPercent: serializeDecimal(item.discountPercent),
    taxId: serializeOptionalBigInt(item.taxId),
    effectiveFrom: serializeEpochMs(item.effectiveFrom) ?? '',
    effectiveTo: serializeEpochMs(item.effectiveTo),
    isActive: item.isActive,
    remarks: item.remarks,
    createdAt: serializeEpochMs(item.createdAt) ?? '',
    updatedAt: serializeEpochMs(item.updatedAt) ?? '',
    deletedAt: serializeEpochMs(item.deletedAt),
    version: item.version.toString(),
  };
}
