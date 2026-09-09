import { SalesInvoiceItem } from '@prisma/client';
import { serializeBigInt, serializeDecimal } from '../utils/sales.util';

export interface SalesInvoiceItemResponse {
  id: string;
  uuid: string;
  salesInvoiceId: string;
  medicineId: string;
  batchId: string;
  unitId: string;
  lineNumber: number;
  soldQuantity: number | null;
  mrp: number | null;
  unitPrice: number | null;
  purchaseRate: number | null;
  conversionFactor: number | null;
  discountPercent: number | null;
  discountAmount: number | null;
  taxPercent: number | null;
  taxAmount: number | null;
  lineAmount: number | null;
  taxId: string | null;
  remarks: string | null;
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  version: number;
}

export function toSalesInvoiceItemResponse(
  item: SalesInvoiceItem,
): SalesInvoiceItemResponse {
  return {
    id: item.id.toString(),
    uuid: item.uuid,
    salesInvoiceId: item.salesInvoiceId.toString(),
    medicineId: item.medicineId.toString(),
    batchId: item.batchId.toString(),
    unitId: item.unitId.toString(),
    lineNumber: item.lineNumber,
    soldQuantity: serializeDecimal(item.soldQuantity),
    mrp: serializeDecimal(item.mrp),
    unitPrice: serializeDecimal(item.unitPrice),
    purchaseRate: serializeDecimal(item.purchaseRate),
    conversionFactor: serializeDecimal(item.conversionFactor),
    discountPercent: serializeDecimal(item.discountPercent),
    discountAmount: serializeDecimal(item.discountAmount),
    taxPercent: serializeDecimal(item.taxPercent),
    taxAmount: serializeDecimal(item.taxAmount),
    lineAmount: serializeDecimal(item.lineAmount),
    taxId: serializeBigInt(item.taxId),
    remarks: item.remarks,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    deletedAt: item.deletedAt,
    version: item.version,
  };
}
