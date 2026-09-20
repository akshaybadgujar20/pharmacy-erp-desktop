export interface StockTransferItem {
  id: string;
  uuid: string;
  stockTransferId: string;
  batchId: string;
  sentQuantity: number;
  receivedQuantity: number | null;
  damagedQuantity: number;
  remarks: string | null;
  version: string;
}

export interface CreateStockTransferItemRequest {
  batchId: string;
  sentQuantity: number;
  remarks?: string;
}

export interface UpdateStockTransferItemRequest {
  version: string;
  sentQuantity?: number;
  receivedQuantity?: number;
  damagedQuantity?: number;
  remarks?: string;
}
