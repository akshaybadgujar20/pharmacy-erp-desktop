export interface SalesInvoicePayment {
  id: string;
  uuid: string;
  paymentNumber: string;
  salesInvoiceId: string;
  branchId: string;
  paymentDate: string;
  paymentMethod: string;
  paymentAmount: number | null;
  tenderedAmount: number | null;
  changeReturned: number | null;
  transactionReference: string | null;
  status: string;
  remarks: string | null;
  version: number;
}

export interface CreateSalesInvoicePaymentRequest {
  paymentDate: string;
  paymentMethod: string;
  paymentAmount: number;
  tenderedAmount?: number;
  changeReturned?: number;
  transactionReference?: string;
  remarks?: string;
}

export interface UpdateSalesInvoicePaymentRequest {
  version: number;
  paymentDate?: string;
  paymentMethod?: string;
  paymentAmount?: number;
  tenderedAmount?: number;
  changeReturned?: number;
  transactionReference?: string;
  remarks?: string;
}

export interface SalesPaymentWorkflowRequest {
  version: number;
  remarks?: string;
}
