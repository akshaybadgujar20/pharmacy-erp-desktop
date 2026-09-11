export interface StockTakeItem {
  id: string;
  uuid: string;
  stockTakeId: string;
  batchId: string;
  systemQuantity: number;
  physicalQuantity: number;
  varianceQuantity: number;
  unitCost: number;
  varianceValue: number;
  varianceType: string;
  remarks: string | null;
  isReconciled: boolean;
  stockAdjustmentId: string | null;
  version: number;
}

export interface CreateStockTakeItemRequest {
  batchId: string;
  physicalQuantity: number;
  remarks?: string;
}

export interface UpdateStockTakeItemRequest {
  version: number;
  physicalQuantity?: number;
  remarks?: string;
}
