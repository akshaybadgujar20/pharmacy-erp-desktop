import { Batch } from '@prisma/client';
import { serializeBigInt, serializeDecimal } from '../utils/inventory.util';

export interface BatchResponse {
  id: string;
  uuid: string;
  medicineId: string;
  batchNumber: string;
  manufacturingDate: string | null;
  expiryDate: string;
  purchaseRate: number;
  mrp: number;
  barcode: string | null;
  isActive: boolean;
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  updatedBy: string | null;
  deletedBy: string | null;
  version: number;
}

export function toBatchResponse(batch: Batch): BatchResponse {
  return {
    id: batch.id.toString(),
    uuid: batch.uuid,
    medicineId: batch.medicineId.toString(),
    batchNumber: batch.batchNumber,
    manufacturingDate: serializeBigInt(batch.manufacturingDate),
    expiryDate: batch.expiryDate.toString(),
    purchaseRate: serializeDecimal(batch.purchaseRate) ?? 0,
    mrp: serializeDecimal(batch.mrp) ?? 0,
    barcode: batch.barcode,
    isActive: batch.isActive,
    createdAt: batch.createdAt,
    updatedAt: batch.updatedAt,
    deletedAt: batch.deletedAt,
    updatedBy: serializeBigInt(batch.updatedBy),
    deletedBy: serializeBigInt(batch.deletedBy),
    version: batch.version,
  };
}
