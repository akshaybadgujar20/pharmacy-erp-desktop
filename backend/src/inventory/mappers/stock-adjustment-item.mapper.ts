import { StockAdjustmentItem } from '@prisma/client';
import { serializeDecimal } from '../utils/inventory.util';

export interface StockAdjustmentItemResponse {
  id: string;
  uuid: string;
  stockAdjustmentId: string;
  batchId: string;
  quantity: number;
  unitCost: number;
  remarks: string | null;
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  version: number;
}

export function toStockAdjustmentItemResponse(
  item: StockAdjustmentItem,
): StockAdjustmentItemResponse {
  return {
    id: item.id.toString(),
    uuid: item.uuid,
    stockAdjustmentId: item.stockAdjustmentId.toString(),
    batchId: item.batchId.toString(),
    quantity: serializeDecimal(item.quantity) ?? 0,
    unitCost: serializeDecimal(item.unitCost) ?? 0,
    remarks: item.remarks,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    deletedAt: item.deletedAt,
    version: item.version,
  };
}
