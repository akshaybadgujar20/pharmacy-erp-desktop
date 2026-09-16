export interface PurchaseInvoiceItem {
  id: string;
  uuid: string;
  purchaseInvoiceId: string;
  goodsReceiptItemId: string | null;
  medicineId: string;
  batchId: string;
  unitId: string;
  lineNumber: number;
  invoiceQuantity: number | null;
  freeQuantity: number | null;
  unitPrice: number | null;
  mrp: number | null;
  discountPercent: number | null;
  discountAmount: number | null;
  taxPercent: number | null;
  taxAmount: number | null;
  lineAmount: number | null;
  remarks: string | null;
  version: number;
}

export interface CreatePurchaseInvoiceItemRequest {
  medicineId: string;
  batchId: string;
  unitId: string;
  goodsReceiptItemId?: string;
  invoiceQuantity: number;
  freeQuantity?: number;
  unitPrice: number;
  mrp: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  remarks?: string;
}

export interface UpdatePurchaseInvoiceItemRequest {
  version: number;
  batchId?: string;
  unitId?: string;
  goodsReceiptItemId?: string | null;
  invoiceQuantity?: number;
  freeQuantity?: number;
  unitPrice?: number;
  mrp?: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  remarks?: string;
}
