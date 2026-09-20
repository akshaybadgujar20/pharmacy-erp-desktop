import { PurchaseWorkflowRequest } from '../purchase-workflow.models';

export interface PurchaseInvoice {
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
  version: string;
}

export interface CreatePurchaseInvoiceRequest {
  branchId: string;
  supplierId: string;
  supplierInvoiceNumber: string;
  goodsReceiptId?: string;
  invoiceDate: string;
  dueDate?: string;
  remarks?: string;
}

export interface UpdatePurchaseInvoiceRequest {
  version: string;
  supplierId?: string;
  supplierInvoiceNumber?: string;
  goodsReceiptId?: string | null;
  invoiceDate?: string;
  dueDate?: string | null;
  remarks?: string;
}

export type PurchaseInvoiceWorkflowRequest = PurchaseWorkflowRequest;
