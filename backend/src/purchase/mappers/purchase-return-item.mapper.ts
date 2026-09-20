import { PurchaseReturnItem } from '@prisma/client';
import { serializeBigInt, serializeDecimal } from '../utils/purchase.util';

export interface PurchaseReturnItemResponse {
  id: string;
  uuid: string;
  purchaseReturnId: string;
  purchaseInvoiceItemId: string | null;
  medicineId: string;
  batchId: string;
  unitId: string;
  lineNumber: number;
  returnQuantity: number | null;
  unitPrice: number | null;
  discountPercent: number | null;
  discountAmount: number | null;
  taxPercent: number | null;
  taxAmount: number | null;
  lineAmount: number | null;
  remarks: string | null;
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  version: string;
}

export function toPurchaseReturnItemResponse(
  item: PurchaseReturnItem,
): PurchaseReturnItemResponse {
  return {
    id: item.id.toString(),
    uuid: item.uuid,
    purchaseReturnId: item.purchaseReturnId.toString(),
    purchaseInvoiceItemId: serializeBigInt(item.purchaseInvoiceItemId),
    medicineId: item.medicineId.toString(),
    batchId: item.batchId.toString(),
    unitId: item.unitId.toString(),
    lineNumber: item.lineNumber,
    returnQuantity: serializeDecimal(item.returnQuantity),
    unitPrice: serializeDecimal(item.unitPrice),
    discountPercent: serializeDecimal(item.discountPercent),
    discountAmount: serializeDecimal(item.discountAmount),
    taxPercent: serializeDecimal(item.taxPercent),
    taxAmount: serializeDecimal(item.taxAmount),
    lineAmount: serializeDecimal(item.lineAmount),
    remarks: item.remarks,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    deletedAt: item.deletedAt,
    version: item.version.toString(),
  };
}
