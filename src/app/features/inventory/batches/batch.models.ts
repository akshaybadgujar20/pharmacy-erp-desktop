export interface Batch {
  id: string;
  uuid: string;
  medicineId: string;
  batchNumber: string;
  manufacturingDate: string | null;
  expiryDate: string;
  purchaseRate: number;
  mrp: number;
  barcode: string | null;
  isActive: boolean;
  version: string;
}

export interface CreateBatchRequest {
  medicineId: string;
  batchNumber: string;
  manufacturingDate?: string;
  expiryDate: string;
  purchaseRate: number;
  mrp: number;
  barcode?: string;
  isActive?: boolean;
}

export interface UpdateBatchRequest {
  version: string;
  medicineId?: string;
  batchNumber?: string;
  manufacturingDate?: string | null;
  expiryDate?: string;
  purchaseRate?: number;
  mrp?: number;
  barcode?: string;
  isActive?: boolean;
}
