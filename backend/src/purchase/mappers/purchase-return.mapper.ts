import { PurchaseReturn } from '@prisma/client';
import { serializeBigInt, serializeDecimal } from '../utils/purchase.util';

export interface PurchaseReturnResponse {
  id: string;
  uuid: string;
  purchaseReturnNumber: string;
  supplierId: string;
  purchaseInvoiceId: string | null;
  branchId: string;
  returnDate: string;
  returnType: string;
  status: string;
  returnReason: string | null;
  grossAmount: number | null;
  discountAmount: number | null;
  taxAmount: number | null;
  netAmount: number | null;
  supplierCreditNoteNo: string | null;
  supplierCreditNoteDate: string | null;
  isSettled: boolean;
  remarks: string | null;
  approvedByEmployeeId: string | null;
  approvedAt: string | null;
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  version: string;
}

export function toPurchaseReturnResponse(
  purchaseReturn: PurchaseReturn,
): PurchaseReturnResponse {
  return {
    id: purchaseReturn.id.toString(),
    uuid: purchaseReturn.uuid,
    purchaseReturnNumber: purchaseReturn.purchaseReturnNumber,
    supplierId: purchaseReturn.supplierId.toString(),
    purchaseInvoiceId: serializeBigInt(purchaseReturn.purchaseInvoiceId),
    branchId: purchaseReturn.branchId.toString(),
    returnDate: purchaseReturn.returnDate.toString(),
    returnType: purchaseReturn.returnType,
    status: purchaseReturn.status,
    returnReason: purchaseReturn.returnReason,
    grossAmount: serializeDecimal(purchaseReturn.grossAmount),
    discountAmount: serializeDecimal(purchaseReturn.discountAmount),
    taxAmount: serializeDecimal(purchaseReturn.taxAmount),
    netAmount: serializeDecimal(purchaseReturn.netAmount),
    supplierCreditNoteNo: purchaseReturn.supplierCreditNoteNo,
    supplierCreditNoteDate: serializeBigInt(
      purchaseReturn.supplierCreditNoteDate,
    ),
    isSettled: purchaseReturn.isSettled,
    remarks: purchaseReturn.remarks,
    approvedByEmployeeId: serializeBigInt(purchaseReturn.approvedByEmployeeId),
    approvedAt: serializeBigInt(purchaseReturn.approvedAt),
    createdAt: purchaseReturn.createdAt,
    updatedAt: purchaseReturn.updatedAt,
    deletedAt: purchaseReturn.deletedAt,
    version: purchaseReturn.version.toString(),
  };
}
