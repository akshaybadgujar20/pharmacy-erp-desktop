export interface PurchaseReturnItem {
  id: string;
  uuid: string;
  purchaseReturnId: string;
  purchaseInvoiceItemId: string | null;
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
  remarks: string | null;
  version: string;
}

export interface CreatePurchaseReturnItemRequest {
  medicineId: string;
  batchId: string;
  unitId: string;
  purchaseInvoiceItemId?: string;
  returnQuantity: number;
  unitPrice: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  remarks?: string;
}

export interface UpdatePurchaseReturnItemRequest {
  version: string;
  batchId?: string;
  unitId?: string;
  purchaseInvoiceItemId?: string | null;
  returnQuantity?: number;
  unitPrice?: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  remarks?: string;
}
