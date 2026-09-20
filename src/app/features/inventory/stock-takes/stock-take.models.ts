export interface StockTake {
  id: string;
  uuid: string;
  stockTakeNumber: string;
  branchId: string;
  stockTakeDate: string;
  countType: string;
  status: string;
  countedByEmployeeId: string;
  approvedByEmployeeId: string | null;
  approvedAt: string | null;
  remarks: string | null;
  version: string;
}

export interface CreateStockTakeRequest {
  branchId: string;
  stockTakeDate: string;
  countType: string;
  countedByEmployeeId: string;
  remarks?: string;
}

export interface UpdateStockTakeRequest {
  version: string;
  stockTakeDate?: string;
  countType?: string;
  countedByEmployeeId?: string;
  remarks?: string;
}

export interface ReconcileStockTakeRequest {
  remarks?: string;
}
