import { StockTakeItem } from '@prisma/client';
import { serializeBigInt, serializeDecimal } from '../utils/inventory.util';

export interface StockTakeItemResponse {
  id: string;
  uuid: string;
  stockTakeId: string;
  batchId: string;
  systemQuantity: number;
  physicalQuantity: number;
  varianceQuantity: number;
  unitCost: number;
  varianceValue: number;
  varianceType: string;
  remarks: string | null;
  isReconciled: boolean;
  stockAdjustmentId: string | null;
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  version: string;
}

export function toStockTakeItemResponse(
  item: StockTakeItem,
): StockTakeItemResponse {
  return {
    id: item.id.toString(),
    uuid: item.uuid,
    stockTakeId: item.stockTakeId.toString(),
    batchId: item.batchId.toString(),
    systemQuantity: serializeDecimal(item.systemQuantity) ?? 0,
    physicalQuantity: serializeDecimal(item.physicalQuantity) ?? 0,
    varianceQuantity: serializeDecimal(item.varianceQuantity) ?? 0,
    unitCost: serializeDecimal(item.unitCost) ?? 0,
    varianceValue: serializeDecimal(item.varianceValue) ?? 0,
    varianceType: item.varianceType,
    remarks: item.remarks,
    isReconciled: item.isReconciled,
    stockAdjustmentId: serializeBigInt(item.stockAdjustmentId),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    deletedAt: item.deletedAt,
    version: item.version.toString(),
  };
}
