import { PriceList } from '@prisma/client';
import {
  serializeEpochMs,
  serializeOptionalBigInt,
} from '../utils/pricing.util';

export interface PriceListResponse {
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
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
}

export function toPriceListResponse(priceList: PriceList): PriceListResponse {
  return {
    id: priceList.id.toString(),
    uuid: priceList.uuid,
    priceListCode: priceList.priceListCode,
    priceListName: priceList.priceListName,
    branchId: serializeOptionalBigInt(priceList.branchId),
    priceListType: priceList.priceListType,
    effectiveFrom: serializeEpochMs(priceList.effectiveFrom) ?? '',
    effectiveTo: serializeEpochMs(priceList.effectiveTo),
    isDefault: priceList.isDefault,
    isActive: priceList.isActive,
    remarks: priceList.remarks,
    createdAt: serializeEpochMs(priceList.createdAt) ?? '',
    updatedAt: serializeEpochMs(priceList.updatedAt) ?? '',
    deletedAt: serializeEpochMs(priceList.deletedAt),
    version: priceList.version,
  };
}
