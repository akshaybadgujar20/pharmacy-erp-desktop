import { SalesReturn } from '@prisma/client';
import { serializeBigInt, serializeDecimal } from '../utils/sales.util';

export interface SalesReturnResponse {
  id: string;
  uuid: string;
  salesReturnNumber: string;
  salesInvoiceId: string;
  customerId: string | null;
  branchId: string;
  returnDate: string;
  returnReason: string;
  grossAmount: number | null;
  discountAmount: number | null;
  taxAmount: number | null;
  roundOffAmount: number | null;
  netAmount: number | null;
  refundAmount: number | null;
  refundMode: string | null;
  creditNoteNumber: string | null;
  status: string;
  remarks: string | null;
  approvedByEmployeeId: string | null;
  approvedAt: string | null;
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  version: string;
}

export function toSalesReturnResponse(
  salesReturn: SalesReturn,
): SalesReturnResponse {
  return {
    id: salesReturn.id.toString(),
    uuid: salesReturn.uuid,
    salesReturnNumber: salesReturn.salesReturnNumber,
    salesInvoiceId: salesReturn.salesInvoiceId.toString(),
    customerId: serializeBigInt(salesReturn.customerId),
    branchId: salesReturn.branchId.toString(),
    returnDate: salesReturn.returnDate.toString(),
    returnReason: salesReturn.returnReason,
    grossAmount: serializeDecimal(salesReturn.grossAmount),
    discountAmount: serializeDecimal(salesReturn.discountAmount),
    taxAmount: serializeDecimal(salesReturn.taxAmount),
    roundOffAmount: serializeDecimal(salesReturn.roundOffAmount),
    netAmount: serializeDecimal(salesReturn.netAmount),
    refundAmount: serializeDecimal(salesReturn.refundAmount),
    refundMode: salesReturn.refundMode,
    creditNoteNumber: salesReturn.creditNoteNumber,
    status: salesReturn.status,
    remarks: salesReturn.remarks,
    approvedByEmployeeId: serializeBigInt(salesReturn.approvedByEmployeeId),
    approvedAt: serializeBigInt(salesReturn.approvedAt),
    createdAt: salesReturn.createdAt,
    updatedAt: salesReturn.updatedAt,
    deletedAt: salesReturn.deletedAt,
    version: salesReturn.version.toString(),
  };
}
