import { PurchaseInvoice } from '@prisma/client';
import { serializeBigInt, serializeDecimal } from '../utils/purchase.util';

export interface PurchaseInvoiceResponse {
  id: string;
  uuid: string;
  purchaseInvoiceNumber: string;
  supplierInvoiceNumber: string;
  supplierId: string;
  goodsReceiptId: string | null;
  branchId: string;
  invoiceDate: string;
  dueDate: string | null;
  grossAmount: number | null;
  discountAmount: number | null;
  taxAmount: number | null;
  roundOffAmount: number | null;
  netAmount: number | null;
  paidAmount: number | null;
  balanceAmount: number | null;
  status: string;
  paymentStatus: string;
  remarks: string | null;
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  version: number;
}

export function toPurchaseInvoiceResponse(
  invoice: PurchaseInvoice,
): PurchaseInvoiceResponse {
  return {
    id: invoice.id.toString(),
    uuid: invoice.uuid,
    purchaseInvoiceNumber: invoice.purchaseInvoiceNumber,
    supplierInvoiceNumber: invoice.supplierInvoiceNumber,
    supplierId: invoice.supplierId.toString(),
    goodsReceiptId: serializeBigInt(invoice.goodsReceiptId),
    branchId: invoice.branchId.toString(),
    invoiceDate: invoice.invoiceDate.toString(),
    dueDate: serializeBigInt(invoice.dueDate),
    grossAmount: serializeDecimal(invoice.grossAmount),
    discountAmount: serializeDecimal(invoice.discountAmount),
    taxAmount: serializeDecimal(invoice.taxAmount),
    roundOffAmount: serializeDecimal(invoice.roundOffAmount),
    netAmount: serializeDecimal(invoice.netAmount),
    paidAmount: serializeDecimal(invoice.paidAmount),
    balanceAmount: serializeDecimal(invoice.balanceAmount),
    status: invoice.status,
    paymentStatus: invoice.paymentStatus,
    remarks: invoice.remarks,
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
    deletedAt: invoice.deletedAt,
    version: invoice.version,
  };
}
