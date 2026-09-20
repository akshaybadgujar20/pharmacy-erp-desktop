import { MedicineGeneric } from '@prisma/client';

export interface MedicineGenericResponse {
  id: string;
  uuid: string;
  genericCode: string;
  genericName: string;
  therapeuticClass: string | null;
  pharmacologicalClass: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  version: string;
}

export function toMedicineGenericResponse(
  generic: MedicineGeneric,
): MedicineGenericResponse {
  return {
    id: generic.id.toString(),
    uuid: generic.uuid,
    genericCode: generic.genericCode,
    genericName: generic.genericName,
    therapeuticClass: generic.therapeuticClass,
    pharmacologicalClass: generic.pharmacologicalClass,
    description: generic.description,
    isActive: generic.isActive,
    createdAt: generic.createdAt,
    updatedAt: generic.updatedAt,
    deletedAt: generic.deletedAt,
    version: generic.version.toString(),
  };
}
