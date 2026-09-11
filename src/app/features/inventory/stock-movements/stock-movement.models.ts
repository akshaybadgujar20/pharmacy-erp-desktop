export interface StockMovement {
  id: string;
  uuid: string;
  movementNumber: string;
  branchId: string;
  medicineId: string;
  batchId: string;
  movementType: string;
  movementDirection: string;
  quantity: number;
  unitCost: number;
  balanceAfter: number;
  referenceTable: string;
  referenceId: string;
  movementDate: string;
  remarks: string | null;
  createdBy: string | null;
  createdAt: string;
}
