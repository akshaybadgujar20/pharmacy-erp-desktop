export interface StockTransferItem {
  id: string;
  uuid: string;
  stockTransferId: string;
  batchId: string;
  sentQuantity: number;
  receivedQuantity: number | null;
  damagedQuantity: number;
  remarks: string | null;
  version: number;
}

export interface CreateStockTransferItemRequest {
  batchId: string;
  sentQuantity: number;
  remarks?: string;
}

export interface UpdateStockTransferItemRequest {
  version: number;
  sentQuantity?: number;
  receivedQuantity?: number;
  damagedQuantity?: number;
  remarks?: string;
}
