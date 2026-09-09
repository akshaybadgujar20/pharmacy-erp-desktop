import { Medicine } from '@prisma/client';
import { serializeBigInt } from '../utils/medicine.util';

export interface MedicineResponse {
  id: string;
  uuid: string;
  medicineCode: string;
  medicineName: string;
  manufacturerId: string;
  categoryId: string;
  scheduleId: string | null;
  unitId: string;
  brandName: string | null;
  strength: string | null;
  dosageForm: string;
  packSize: string | null;
  hsnCode: string | null;
  barcode: string | null;
  requiresPrescription: boolean;
  narcoticDrug: boolean;
  refrigerated: boolean;
  discontinued: boolean;
  isActive: boolean;
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  updatedBy: string | null;
  deletedBy: string | null;
  version: number;
}

export function toMedicineResponse(medicine: Medicine): MedicineResponse {
  return {
    id: medicine.id.toString(),
    uuid: medicine.uuid,
    medicineCode: medicine.medicineCode,
    medicineName: medicine.medicineName,
    manufacturerId: medicine.manufacturerId.toString(),
    categoryId: medicine.categoryId.toString(),
    scheduleId: serializeBigInt(medicine.scheduleId),
    unitId: medicine.unitId.toString(),
    brandName: medicine.brandName,
    strength: medicine.strength,
    dosageForm: medicine.dosageForm,
    packSize: medicine.packSize,
    hsnCode: medicine.hsnCode,
    barcode: medicine.barcode,
    requiresPrescription: medicine.requiresPrescription,
    narcoticDrug: medicine.narcoticDrug,
    refrigerated: medicine.refrigerated,
    discontinued: medicine.discontinued,
    isActive: medicine.isActive,
    createdAt: medicine.createdAt,
    updatedAt: medicine.updatedAt,
    deletedAt: medicine.deletedAt,
    updatedBy: serializeBigInt(medicine.updatedBy),
    deletedBy: serializeBigInt(medicine.deletedBy),
    version: medicine.version,
  };
}
