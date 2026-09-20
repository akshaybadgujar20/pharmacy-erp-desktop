import { StockTransfer } from '@prisma/client';
import { serializeBigInt } from '../utils/inventory.util';

export interface StockTransferResponse {
  id: string;
  uuid: string;
  transferNumber: string;
  sourceBranchId: string;
  destinationBranchId: string;
  transferDate: string;
  expectedArrivalDate: string | null;
  receivedDate: string | null;
  status: string;
  transferType: string;
  approvedByEmployeeId: string | null;
  approvedAt: string | null;
  remarks: string | null;
  createdBy: string | null;
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  version: string;
}

export function toStockTransferResponse(
  transfer: StockTransfer,
): StockTransferResponse {
  return {
    id: transfer.id.toString(),
    uuid: transfer.uuid,
    transferNumber: transfer.transferNumber,
    sourceBranchId: transfer.sourceBranchId.toString(),
    destinationBranchId: transfer.destinationBranchId.toString(),
    transferDate: transfer.transferDate.toString(),
    expectedArrivalDate: serializeBigInt(transfer.expectedArrivalDate),
    receivedDate: serializeBigInt(transfer.receivedDate),
    status: transfer.status,
    transferType: transfer.transferType,
    approvedByEmployeeId: serializeBigInt(transfer.approvedByEmployeeId),
    approvedAt: serializeBigInt(transfer.approvedAt),
    remarks: transfer.remarks,
    createdBy: serializeBigInt(transfer.createdBy),
    createdAt: transfer.createdAt,
    updatedAt: transfer.updatedAt,
    deletedAt: transfer.deletedAt,
    version: transfer.version.toString(),
  };
}
