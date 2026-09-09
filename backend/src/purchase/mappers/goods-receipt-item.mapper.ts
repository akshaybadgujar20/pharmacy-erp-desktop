import { GoodsReceiptItem } from '@prisma/client';
import { serializeBigInt, serializeDecimal } from '../utils/purchase.util';

export interface GoodsReceiptItemResponse {
  id: string;
  uuid: string;
  goodsReceiptId: string;
  purchaseOrderItemId: string | null;
  medicineId: string;
  batchId: string | null;
  unitId: string;
  lineNumber: number;
  batchNumber: string;
  manufacturingDate: string | null;
  expiryDate: string;
  receivedQuantity: number | null;
  freeQuantity: number | null;
  rejectedQuantity: number | null;
  acceptedQuantity: number | null;
  inspectionStatus: string;
  rejectionReason: string | null;
  conversionFactor: number | null;
  purchaseRate: number | null;
  mrp: number | null;
  saleRate: number | null;
  discountPercent: number | null;
  discountAmount: number | null;
  taxPercent: number | null;
  taxAmount: number | null;
  lineAmount: number | null;
  remarks: string | null;
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  version: number;
}

export function toGoodsReceiptItemResponse(
  item: GoodsReceiptItem,
): GoodsReceiptItemResponse {
  return {
    id: item.id.toString(),
    uuid: item.uuid,
    goodsReceiptId: item.goodsReceiptId.toString(),
    purchaseOrderItemId: serializeBigInt(item.purchaseOrderItemId),
    medicineId: item.medicineId.toString(),
    batchId: serializeBigInt(item.batchId),
    unitId: item.unitId.toString(),
    lineNumber: item.lineNumber,
    batchNumber: item.batchNumber,
    manufacturingDate: serializeBigInt(item.manufacturingDate),
    expiryDate: item.expiryDate.toString(),
    receivedQuantity: serializeDecimal(item.receivedQuantity),
    freeQuantity: serializeDecimal(item.freeQuantity),
    rejectedQuantity: serializeDecimal(item.rejectedQuantity),
    acceptedQuantity: serializeDecimal(item.acceptedQuantity),
    inspectionStatus: item.inspectionStatus,
    rejectionReason: item.rejectionReason,
    conversionFactor: serializeDecimal(item.conversionFactor),
    purchaseRate: serializeDecimal(item.purchaseRate),
    mrp: serializeDecimal(item.mrp),
    saleRate: serializeDecimal(item.saleRate),
    discountPercent: serializeDecimal(item.discountPercent),
    discountAmount: serializeDecimal(item.discountAmount),
    taxPercent: serializeDecimal(item.taxPercent),
    taxAmount: serializeDecimal(item.taxAmount),
    lineAmount: serializeDecimal(item.lineAmount),
    remarks: item.remarks,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    deletedAt: item.deletedAt,
    version: item.version,
  };
}
