export interface StockAdjustmentItem {
  id: string;
  uuid: string;
  stockAdjustmentId: string;
  batchId: string;
  quantity: number;
  unitCost: number;
  remarks: string | null;
  version: string;
}

export interface CreateStockAdjustmentItemRequest {
  batchId: string;
  quantity: number;
  unitCost: number;
  remarks?: string;
}

export interface UpdateStockAdjustmentItemRequest {
  version: string;
  quantity?: number;
  unitCost?: number;
  remarks?: string;
}
