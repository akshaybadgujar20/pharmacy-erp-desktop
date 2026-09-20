import { StockAdjustment } from '@prisma/client';
import { serializeBigInt } from '../utils/inventory.util';

export interface StockAdjustmentResponse {
  id: string;
  uuid: string;
  adjustmentNumber: string;
  branchId: string;
  adjustmentType: string;
  adjustmentDate: string;
  reason: string;
  approvedByEmployeeId: string | null;
  approvedAt: string | null;
  status: string;
  isActive: boolean;
  createdBy: string | null;
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  version: string;
}

export function toStockAdjustmentResponse(
  adjustment: StockAdjustment,
): StockAdjustmentResponse {
  return {
    id: adjustment.id.toString(),
    uuid: adjustment.uuid,
    adjustmentNumber: adjustment.adjustmentNumber,
    branchId: adjustment.branchId.toString(),
    adjustmentType: adjustment.adjustmentType,
    adjustmentDate: adjustment.adjustmentDate.toString(),
    reason: adjustment.reason,
    approvedByEmployeeId: serializeBigInt(adjustment.approvedByEmployeeId),
    approvedAt: serializeBigInt(adjustment.approvedAt),
    status: adjustment.status,
    isActive: adjustment.isActive,
    createdBy: serializeBigInt(adjustment.createdBy),
    createdAt: adjustment.createdAt,
    updatedAt: adjustment.updatedAt,
    deletedAt: adjustment.deletedAt,
    version: adjustment.version.toString(),
  };
}
