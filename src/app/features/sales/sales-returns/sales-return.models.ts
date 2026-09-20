export interface SalesReturn {
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
  version: string;
}

export interface CreateSalesReturnRequest {
  branchId: string;
  salesInvoiceId: string;
  customerId?: string;
  returnDate: string;
  returnReason: string;
  remarks?: string;
}

export interface UpdateSalesReturnRequest {
  version: string;
  customerId?: string;
  returnDate?: string;
  returnReason?: string;
  refundMode?: string;
  creditNoteNumber?: string;
  remarks?: string;
}

export interface SalesReturnWorkflowRequest {
  version: string;
  remarks?: string;
}
