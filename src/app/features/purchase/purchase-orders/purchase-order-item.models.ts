export interface PurchaseOrderItem {
  id: string;
  uuid: string;
  purchaseOrderId: string;
  medicineId: string;
  unitId: string;
  lineNumber: number;
  orderedQuantity: number | null;
  receivedQuantity: number | null;
  cancelledQuantity: number | null;
  conversionFactor: number | null;
  unitPrice: number | null;
  discountPercent: number | null;
  discountAmount: number | null;
  taxPercent: number | null;
  taxAmount: number | null;
  lineAmount: number | null;
  isClosed: boolean;
  version: string;
}

export interface CreatePurchaseOrderItemRequest {
  medicineId: string;
  unitId: string;
  orderedQuantity: number;
  unitPrice: number;
  conversionFactor?: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  isClosed?: boolean;
}

export interface UpdatePurchaseOrderItemRequest {
  version: string;
  unitId?: string;
  orderedQuantity?: number;
  unitPrice?: number;
  conversionFactor?: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  isClosed?: boolean;
}
