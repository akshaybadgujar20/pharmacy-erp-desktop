import { StockTransferItem } from '@prisma/client';
import { serializeDecimal } from '../utils/inventory.util';

export interface StockTransferItemResponse {
  id: string;
  uuid: string;
  stockTransferId: string;
  batchId: string;
  sentQuantity: number;
  receivedQuantity: number | null;
  damagedQuantity: number;
  remarks: string | null;
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  version: string;
}

export function toStockTransferItemResponse(
  item: StockTransferItem,
): StockTransferItemResponse {
  return {
    id: item.id.toString(),
    uuid: item.uuid,
    stockTransferId: item.stockTransferId.toString(),
    batchId: item.batchId.toString(),
    sentQuantity: serializeDecimal(item.sentQuantity) ?? 0,
    receivedQuantity: serializeDecimal(item.receivedQuantity),
    damagedQuantity: serializeDecimal(item.damagedQuantity) ?? 0,
    remarks: item.remarks,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    deletedAt: item.deletedAt,
    version: item.version.toString(),
  };
}
