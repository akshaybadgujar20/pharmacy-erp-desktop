import { PurchaseOrderItem } from '@prisma/client';
import { serializeDecimal } from '../utils/purchase.util';

export interface PurchaseOrderItemResponse {
  id: string;
  uuid: string;
  purchaseOrderId: string;
  medicineId: string;
  unitId: string;
  lineNumber: number;
  orderedQuantity: number | null;
  receivedQuantity: number | null;
  cancelledQuantity: number | null;
  conversionFactor: number | null;
  unitPrice: number | null;
  discountPercent: number | null;
  discountAmount: number | null;
  taxPercent: number | null;
  taxAmount: number | null;
  lineAmount: number | null;
  isClosed: boolean;
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  version: number;
}

export function toPurchaseOrderItemResponse(
  item: PurchaseOrderItem,
): PurchaseOrderItemResponse {
  return {
    id: item.id.toString(),
    uuid: item.uuid,
    purchaseOrderId: item.purchaseOrderId.toString(),
    medicineId: item.medicineId.toString(),
    unitId: item.unitId.toString(),
    lineNumber: item.lineNumber,
    orderedQuantity: serializeDecimal(item.orderedQuantity),
    receivedQuantity: serializeDecimal(item.receivedQuantity),
    cancelledQuantity: serializeDecimal(item.cancelledQuantity),
    conversionFactor: serializeDecimal(item.conversionFactor),
    unitPrice: serializeDecimal(item.unitPrice),
    discountPercent: serializeDecimal(item.discountPercent),
    discountAmount: serializeDecimal(item.discountAmount),
    taxPercent: serializeDecimal(item.taxPercent),
    taxAmount: serializeDecimal(item.taxAmount),
    lineAmount: serializeDecimal(item.lineAmount),
    isClosed: item.isClosed,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    deletedAt: item.deletedAt,
    version: item.version,
  };
}
