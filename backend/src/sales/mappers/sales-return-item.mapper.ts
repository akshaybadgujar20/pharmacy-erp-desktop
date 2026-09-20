import { SalesReturnItem } from '@prisma/client';
import { serializeDecimal } from '../utils/sales.util';

export interface SalesReturnItemResponse {
  id: string;
  uuid: string;
  salesReturnId: string;
  salesInvoiceItemId: string;
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
  returnReason: string;
  disposition: string;
  remarks: string | null;
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  version: string;
}

export function toSalesReturnItemResponse(
  item: SalesReturnItem,
): SalesReturnItemResponse {
  return {
    id: item.id.toString(),
    uuid: item.uuid,
    salesReturnId: item.salesReturnId.toString(),
    salesInvoiceItemId: item.salesInvoiceItemId.toString(),
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
    returnReason: item.returnReason,
    disposition: item.disposition,
    remarks: item.remarks,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    deletedAt: item.deletedAt,
    version: item.version.toString(),
  };
}
