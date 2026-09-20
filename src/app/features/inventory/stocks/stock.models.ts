export interface Stock {
  id: string;
  uuid: string;
  batchId: string;
  branchId: string;
  availableQuantity: number;
  reservedQuantity: number;
  damagedQuantity: number;
  expiredQuantity: number;
  inTransitQuantity: number;
  lastMovementAt: string | null;
  isActive: boolean;
  version: string;
}
