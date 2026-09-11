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
  version: number;
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
  version: number;
  medicineId?: string;
  batchNumber?: string;
  manufacturingDate?: string | null;
  expiryDate?: string;
  purchaseRate?: number;
  mrp?: number;
  barcode?: string;
  isActive?: boolean;
}
