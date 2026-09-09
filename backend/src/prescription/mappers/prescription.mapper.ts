import { Prescription } from '@prisma/client';
import { serializeEpochMs } from '../utils/prescription.util';

export interface PrescriptionResponse {
  id: string;
  uuid: string;
  prescriptionNumber: string;
  customerId: string;
  doctorId: string;
  branchId: string;
  prescriptionDate: string;
  validUntil: string | null;
  diagnosis: string | null;
  symptoms: string | null;
  visitNumber: string | null;
  status: string;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
}

export function toPrescriptionResponse(
  prescription: Prescription,
): PrescriptionResponse {
  return {
    id: prescription.id.toString(),
    uuid: prescription.uuid,
    prescriptionNumber: prescription.prescriptionNumber,
    customerId: prescription.customerId.toString(),
    doctorId: prescription.doctorId.toString(),
    branchId: prescription.branchId.toString(),
    prescriptionDate: serializeEpochMs(prescription.prescriptionDate) ?? '',
    validUntil: serializeEpochMs(prescription.validUntil),
    diagnosis: prescription.diagnosis,
    symptoms: prescription.symptoms,
    visitNumber: prescription.visitNumber,
    status: prescription.status,
    remarks: prescription.remarks,
    createdAt: serializeEpochMs(prescription.createdAt) ?? '',
    updatedAt: serializeEpochMs(prescription.updatedAt) ?? '',
    deletedAt: serializeEpochMs(prescription.deletedAt),
    version: prescription.version,
  };
}
