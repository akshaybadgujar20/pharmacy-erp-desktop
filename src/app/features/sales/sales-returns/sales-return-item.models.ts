export interface SalesReturnItem {
  id: string;
  uuid: string;
  salesReturnId: string;
  salesInvoiceItemId: string;
  medicineId: string;
  batchId: string;
  unitId: string;
  lineNumber: number;
  returnQuantity: number | null;
  unitPrice: number | null;
  discountPercent: number | null;
  discountAmount: number | null;
  taxPercent: number | null;
  taxAmount: number | null;
  lineAmount: number | null;
  returnReason: string;
  disposition: string;
  remarks: string | null;
  version: number;
}

export interface CreateSalesReturnItemRequest {
  salesInvoiceItemId: string;
  medicineId: string;
  batchId: string;
  unitId: string;
  returnQuantity: number;
  unitPrice: number;
  returnReason: string;
  disposition?: string;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  remarks?: string;
}

export interface UpdateSalesReturnItemRequest {
  version: number;
  batchId?: string;
  unitId?: string;
  returnQuantity?: number;
  unitPrice?: number;
  returnReason?: string;
  disposition?: string;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  remarks?: string;
}
