export interface StockAdjustment {
  id: string;
  uuid: string;
  adjustmentNumber: string;
  branchId: string;
  adjustmentType: string;
  adjustmentDate: string;
  reason: string;
  approvedByEmployeeId: string | null;
  approvedAt: string | null;
  status: string;
  isActive: boolean;
  createdBy: string | null;
  version: number;
}

export interface CreateStockAdjustmentRequest {
  branchId: string;
  adjustmentType: string;
  adjustmentDate: string;
  reason: string;
  isActive?: boolean;
}

export interface UpdateStockAdjustmentRequest {
  version: number;
  adjustmentType?: string;
  adjustmentDate?: string;
  reason?: string;
  isActive?: boolean;
}

export interface ApproveStockAdjustmentRequest {
  remarks?: string;
}
