import { MedicineSalt } from '@prisma/client';
import { serializeBigInt, serializeDecimal } from '../utils/medicine.util';

export interface MedicineSaltResponse {
  id: string;
  uuid: string;
  medicineId: string;
  saltCompositionId: string;
  medicineGenericId: string | null;
  sequenceNo: number;
  percentage: string | null;
  version: number;
}

export function toMedicineSaltResponse(
  medicineSalt: MedicineSalt,
): MedicineSaltResponse {
  return {
    id: medicineSalt.id.toString(),
    uuid: medicineSalt.uuid,
    medicineId: medicineSalt.medicineId.toString(),
    saltCompositionId: medicineSalt.saltCompositionId.toString(),
    medicineGenericId: serializeBigInt(medicineSalt.medicineGenericId),
    sequenceNo: medicineSalt.sequenceNo,
    percentage: serializeDecimal(medicineSalt.percentage),
    version: medicineSalt.version,
  };
}
