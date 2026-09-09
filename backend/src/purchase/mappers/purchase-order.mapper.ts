import { PurchaseOrder } from '@prisma/client';
import { serializeBigInt, serializeDecimal } from '../utils/purchase.util';

export interface PurchaseOrderResponse {
  id: string;
  uuid: string;
  purchaseOrderNumber: string;
  supplierId: string;
  branchId: string;
  orderDate: string;
  expectedDeliveryDate: string | null;
  grossAmount: number | null;
  discountAmount: number | null;
  taxAmount: number | null;
  netAmount: number | null;
  status: string;
  remarks: string | null;
  approvedByEmployeeId: string | null;
  approvedAt: string | null;
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  version: number;
}

export function toPurchaseOrderResponse(
  order: PurchaseOrder,
): PurchaseOrderResponse {
  return {
    id: order.id.toString(),
    uuid: order.uuid,
    purchaseOrderNumber: order.purchaseOrderNumber,
    supplierId: order.supplierId.toString(),
    branchId: order.branchId.toString(),
    orderDate: order.orderDate.toString(),
    expectedDeliveryDate: serializeBigInt(order.expectedDeliveryDate),
    grossAmount: serializeDecimal(order.grossAmount),
    discountAmount: serializeDecimal(order.discountAmount),
    taxAmount: serializeDecimal(order.taxAmount),
    netAmount: serializeDecimal(order.netAmount),
    status: order.status,
    remarks: order.remarks,
    approvedByEmployeeId: serializeBigInt(order.approvedByEmployeeId),
    approvedAt: serializeBigInt(order.approvedAt),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    deletedAt: order.deletedAt,
    version: order.version,
  };
}
