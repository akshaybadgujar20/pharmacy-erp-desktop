export interface GoodsReceiptItem {
  id: string;
  uuid: string;
  goodsReceiptId: string;
  purchaseOrderItemId: string | null;
  medicineId: string;
  batchId: string | null;
  unitId: string;
  lineNumber: number;
  batchNumber: string;
  manufacturingDate: string | null;
  expiryDate: string;
  receivedQuantity: number | null;
  freeQuantity: number | null;
  rejectedQuantity: number | null;
  acceptedQuantity: number | null;
  inspectionStatus: string;
  rejectionReason: string | null;
  conversionFactor: number | null;
  purchaseRate: number | null;
  mrp: number | null;
  saleRate: number | null;
  discountPercent: number | null;
  discountAmount: number | null;
  taxPercent: number | null;
  taxAmount: number | null;
  lineAmount: number | null;
  remarks: string | null;
  version: number;
}

export interface CreateGoodsReceiptItemRequest {
  medicineId: string;
  unitId: string;
  purchaseOrderItemId?: string;
  batchNumber: string;
  manufacturingDate?: string;
  expiryDate: string;
  receivedQuantity: number;
  freeQuantity?: number;
  rejectedQuantity?: number;
  acceptedQuantity: number;
  inspectionStatus?: string;
  conversionFactor?: number;
  purchaseRate: number;
  mrp: number;
  saleRate: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  remarks?: string;
}

export interface UpdateGoodsReceiptItemRequest {
  version: number;
  unitId?: string;
  purchaseOrderItemId?: string | null;
  batchNumber?: string;
  manufacturingDate?: string | null;
  expiryDate?: string;
  receivedQuantity?: number;
  freeQuantity?: number;
  rejectedQuantity?: number;
  acceptedQuantity?: number;
  inspectionStatus?: string;
  purchaseRate?: number;
  mrp?: number;
  saleRate?: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  remarks?: string;
}
