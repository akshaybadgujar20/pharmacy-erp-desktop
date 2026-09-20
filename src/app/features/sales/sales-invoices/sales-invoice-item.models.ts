export interface SalesInvoiceItem {
  id: string;
  uuid: string;
  salesInvoiceId: string;
  medicineId: string;
  batchId: string;
  unitId: string;
  lineNumber: number;
  soldQuantity: number | null;
  mrp: number | null;
  unitPrice: number | null;
  purchaseRate: number | null;
  conversionFactor: number | null;
  discountPercent: number | null;
  discountAmount: number | null;
  taxPercent: number | null;
  taxAmount: number | null;
  lineAmount: number | null;
  taxId: string | null;
  remarks: string | null;
  version: string;
}

export interface CreateSalesInvoiceItemRequest {
  medicineId: string;
  batchId: string;
  unitId: string;
  soldQuantity: number;
  conversionFactor?: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  taxId?: string;
  remarks?: string;
}

export interface UpdateSalesInvoiceItemRequest {
  version: string;
  batchId?: string;
  unitId?: string;
  soldQuantity?: number;
  conversionFactor?: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  taxId?: string;
  remarks?: string;
}
