import { Stock } from '@prisma/client';
import { serializeBigInt, serializeDecimal } from '../utils/inventory.util';

export interface StockResponse {
  id: string;
  uuid: string;
  batchId: string;
  branchId: string;
  availableQuantity: number;
  reservedQuantity: number;
  damagedQuantity: number;
  expiredQuantity: number;
  inTransitQuantity: number;
  lastMovementAt: string | null;
  isActive: boolean;
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  version: string;
}

export function toStockResponse(stock: Stock): StockResponse {
  return {
    id: stock.id.toString(),
    uuid: stock.uuid,
    batchId: stock.batchId.toString(),
    branchId: stock.branchId.toString(),
    availableQuantity: serializeDecimal(stock.availableQuantity) ?? 0,
    reservedQuantity: serializeDecimal(stock.reservedQuantity) ?? 0,
    damagedQuantity: serializeDecimal(stock.damagedQuantity) ?? 0,
    expiredQuantity: serializeDecimal(stock.expiredQuantity) ?? 0,
    inTransitQuantity: serializeDecimal(stock.inTransitQuantity) ?? 0,
    lastMovementAt: serializeBigInt(stock.lastMovementAt),
    isActive: stock.isActive,
    createdAt: stock.createdAt,
    updatedAt: stock.updatedAt,
    deletedAt: stock.deletedAt,
    version: stock.version.toString(),
  };
}
