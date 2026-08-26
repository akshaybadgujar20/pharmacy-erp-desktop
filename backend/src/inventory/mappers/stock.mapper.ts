import { Doctor } from '@prisma/client';
import { serializeDate, serializeDecimal } from '../utils/inventory.util';

export interface DoctorResponse {
  id: string;
  partyId: string;
  uuid: string;
  doctorCode: string;
  registrationNumber: string;
  qualification: string | null;
  specialization: string | null;
  hospitalName: string | null;
  consultationFee: string | null;
  isVisitingDoctor: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
}

export function toDoctorResponse(doctor: Doctor): DoctorResponse {
  return {
    id: doctor.id.toString(),
    partyId: doctor.partyId.toString(),
    uuid: doctor.uuid,
    doctorCode: doctor.doctorCode,
    registrationNumber: doctor.registrationNumber,
    qualification: doctor.qualification,
    specialization: doctor.specialization,
    hospitalName: doctor.hospitalName,
    consultationFee: serializeDecimal(doctor.consultationFee),
    isVisitingDoctor: doctor.isVisitingDoctor,
    isActive: doctor.isActive,
    createdAt: doctor.createdAt.toISOString(),
    updatedAt: doctor.updatedAt.toISOString(),
    deletedAt: serializeDate(doctor.deletedAt),
    version: doctor.version,
  };
}
