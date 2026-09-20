import { PurchaseWorkflowRequest } from '../purchase-workflow.models';

export interface PurchaseReturn {
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
  version: string;
}

export interface CreatePurchaseReturnRequest {
  branchId: string;
  supplierId: string;
  purchaseInvoiceId?: string;
  returnDate: string;
  returnType: string;
  returnReason?: string;
  remarks?: string;
}

export interface UpdatePurchaseReturnRequest {
  version: string;
  supplierId?: string;
  purchaseInvoiceId?: string | null;
  returnDate?: string;
  returnType?: string;
  returnReason?: string;
  remarks?: string;
}

export type PurchaseReturnWorkflowRequest = PurchaseWorkflowRequest;
