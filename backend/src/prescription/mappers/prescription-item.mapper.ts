import { PrescriptionItem } from '@prisma/client';
import { serializeDecimal, serializeEpochMs } from '../utils/prescription.util';

export interface PrescriptionItemResponse {
  id: string;
  uuid: string;
  prescriptionId: string;
  medicineId: string;
  unitId: string;
  lineNumber: number;
  prescribedQuantity: string;
  dispensedQuantity: string;
  remainingQuantity: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  route: string | null;
  instructions: string | null;
  status: string;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
}

export function toPrescriptionItemResponse(
  item: PrescriptionItem,
): PrescriptionItemResponse {
  return {
    id: item.id.toString(),
    uuid: item.uuid,
    prescriptionId: item.prescriptionId.toString(),
    medicineId: item.medicineId.toString(),
    unitId: item.unitId.toString(),
    lineNumber: item.lineNumber,
    prescribedQuantity: serializeDecimal(item.prescribedQuantity) ?? '0',
    dispensedQuantity: serializeDecimal(item.dispensedQuantity) ?? '0',
    remainingQuantity: serializeDecimal(item.remainingQuantity) ?? '0',
    dosage: item.dosage,
    frequency: item.frequency,
    duration: item.duration,
    route: item.route,
    instructions: item.instructions,
    status: item.status,
    remarks: item.remarks,
    createdAt: serializeEpochMs(item.createdAt) ?? '',
    updatedAt: serializeEpochMs(item.updatedAt) ?? '',
    deletedAt: serializeEpochMs(item.deletedAt),
    version: item.version,
  };
}
