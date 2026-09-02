import { StockMovement } from '@prisma/client';
import { serializeBigInt, serializeDecimal } from '../utils/inventory.util';

export interface StockMovementResponse {
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
  createdAt: bigint;
}

export function toStockMovementResponse(
  movement: StockMovement,
): StockMovementResponse {
  return {
    id: movement.id.toString(),
    uuid: movement.uuid,
    movementNumber: movement.movementNumber,
    branchId: movement.branchId.toString(),
    medicineId: movement.medicineId.toString(),
    batchId: movement.batchId.toString(),
    movementType: movement.movementType,
    movementDirection: movement.movementDirection,
    quantity: serializeDecimal(movement.quantity) ?? 0,
    unitCost: serializeDecimal(movement.unitCost) ?? 0,
    balanceAfter: serializeDecimal(movement.balanceAfter) ?? 0,
    referenceTable: movement.referenceTable,
    referenceId: movement.referenceId.toString(),
    movementDate: movement.movementDate.toString(),
    remarks: movement.remarks,
    createdBy: serializeBigInt(movement.createdBy),
    createdAt: movement.createdAt,
  };
}
