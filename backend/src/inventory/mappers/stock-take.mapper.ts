import { StockTake } from '@prisma/client';
import { serializeBigInt } from '../utils/inventory.util';

export interface StockTakeResponse {
  id: string;
  uuid: string;
  stockTakeNumber: string;
  branchId: string;
  stockTakeDate: string;
  countType: string;
  status: string;
  countedByEmployeeId: string;
  approvedByEmployeeId: string | null;
  approvedAt: string | null;
  remarks: string | null;
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  version: number;
}

export function toStockTakeResponse(stockTake: StockTake): StockTakeResponse {
  return {
    id: stockTake.id.toString(),
    uuid: stockTake.uuid,
    stockTakeNumber: stockTake.stockTakeNumber,
    branchId: stockTake.branchId.toString(),
    stockTakeDate: stockTake.stockTakeDate.toString(),
    countType: stockTake.countType,
    status: stockTake.status,
    countedByEmployeeId: stockTake.countedByEmployeeId.toString(),
    approvedByEmployeeId: serializeBigInt(stockTake.approvedByEmployeeId),
    approvedAt: serializeBigInt(stockTake.approvedAt),
    remarks: stockTake.remarks,
    createdAt: stockTake.createdAt,
    updatedAt: stockTake.updatedAt,
    deletedAt: stockTake.deletedAt,
    version: stockTake.version,
  };
}
