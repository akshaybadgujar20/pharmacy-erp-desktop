export interface StockTransfer {
  id: string;
  uuid: string;
  transferNumber: string;
  sourceBranchId: string;
  destinationBranchId: string;
  transferDate: string;
  expectedArrivalDate: string | null;
  receivedDate: string | null;
  status: string;
  transferType: string;
  approvedByEmployeeId: string | null;
  approvedAt: string | null;
  remarks: string | null;
  createdBy: string | null;
  version: number;
}

export interface CreateStockTransferRequest {
  sourceBranchId: string;
  destinationBranchId: string;
  transferDate: string;
  transferType: string;
  expectedArrivalDate?: string;
  remarks?: string;
}

export interface UpdateStockTransferRequest {
  version: number;
  transferDate?: string;
  transferType?: string;
  expectedArrivalDate?: string | null;
  remarks?: string;
}

export interface DispatchStockTransferRequest {
  remarks?: string;
}

export interface ReceiveStockTransferRequest {
  remarks?: string;
}
