import { SalesInvoice } from '@prisma/client';
import { serializeBigInt, serializeDecimal } from '../utils/sales.util';

export interface SalesInvoiceResponse {
  id: string;
  uuid: string;
  invoiceNumber: string;
  customerId: string | null;
  prescriptionId: string | null;
  branchId: string;
  invoiceDate: string;
  patientName: string | null;
  doctorName: string | null;
  grossAmount: number | null;
  discountAmount: number | null;
  taxAmount: number | null;
  roundOffAmount: number | null;
  netAmount: number | null;
  paidAmount: number | null;
  balanceAmount: number | null;
  paymentMode: string | null;
  paymentStatus: string;
  status: string;
  salesType: string;
  remarks: string | null;
  createdBy: string | null;
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  version: string;
}

export function toSalesInvoiceResponse(
  invoice: SalesInvoice,
): SalesInvoiceResponse {
  return {
    id: invoice.id.toString(),
    uuid: invoice.uuid,
    invoiceNumber: invoice.invoiceNumber,
    customerId: serializeBigInt(invoice.customerId),
    prescriptionId: serializeBigInt(invoice.prescriptionId),
    branchId: invoice.branchId.toString(),
    invoiceDate: invoice.invoiceDate.toString(),
    patientName: invoice.patientName,
    doctorName: invoice.doctorName,
    grossAmount: serializeDecimal(invoice.grossAmount),
    discountAmount: serializeDecimal(invoice.discountAmount),
    taxAmount: serializeDecimal(invoice.taxAmount),
    roundOffAmount: serializeDecimal(invoice.roundOffAmount),
    netAmount: serializeDecimal(invoice.netAmount),
    paidAmount: serializeDecimal(invoice.paidAmount),
    balanceAmount: serializeDecimal(invoice.balanceAmount),
    paymentMode: invoice.paymentMode,
    paymentStatus: invoice.paymentStatus,
    status: invoice.status,
    salesType: invoice.salesType,
    remarks: invoice.remarks,
    createdBy: serializeBigInt(invoice.createdBy),
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
    deletedAt: invoice.deletedAt,
    version: invoice.version.toString(),
  };
}
