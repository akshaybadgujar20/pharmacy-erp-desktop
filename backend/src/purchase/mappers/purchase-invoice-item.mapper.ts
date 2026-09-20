import { PurchaseInvoiceItem } from '@prisma/client';
import { serializeBigInt, serializeDecimal } from '../utils/purchase.util';

export interface PurchaseInvoiceItemResponse {
  id: string;
  uuid: string;
  purchaseInvoiceId: string;
  goodsReceiptItemId: string | null;
  medicineId: string;
  batchId: string;
  unitId: string;
  lineNumber: number;
  invoiceQuantity: number | null;
  freeQuantity: number | null;
  unitPrice: number | null;
  mrp: number | null;
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

export function toPurchaseInvoiceItemResponse(
  item: PurchaseInvoiceItem,
): PurchaseInvoiceItemResponse {
  return {
    id: item.id.toString(),
    uuid: item.uuid,
    purchaseInvoiceId: item.purchaseInvoiceId.toString(),
    goodsReceiptItemId: serializeBigInt(item.goodsReceiptItemId),
    medicineId: item.medicineId.toString(),
    batchId: item.batchId.toString(),
    unitId: item.unitId.toString(),
    lineNumber: item.lineNumber,
    invoiceQuantity: serializeDecimal(item.invoiceQuantity),
    freeQuantity: serializeDecimal(item.freeQuantity),
    unitPrice: serializeDecimal(item.unitPrice),
    mrp: serializeDecimal(item.mrp),
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
