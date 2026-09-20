export interface SalesInvoice {
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
  version: string;
}

export interface CreateSalesInvoiceRequest {
  branchId: string;
  customerId?: string;
  prescriptionId?: string;
  invoiceDate: string;
  patientName?: string;
  doctorName?: string;
  salesType?: string;
  remarks?: string;
}

export interface UpdateSalesInvoiceRequest {
  version: string;
  customerId?: string;
  prescriptionId?: string;
  invoiceDate?: string;
  patientName?: string;
  doctorName?: string;
  salesType?: string;
  paymentMode?: string;
  remarks?: string;
}

export interface SalesWorkflowRequest {
  version: string;
  remarks?: string;
}
