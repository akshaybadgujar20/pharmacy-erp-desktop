import { MedicineSchedule } from '@prisma/client';

export interface MedicineScheduleResponse {
  id: string;
  uuid: string;
  scheduleCode: string;
  scheduleName: string;
  description: string | null;
  requiresPrescription: boolean;
  requiresDoctorDetails: boolean;
  maintainSalesRegister: boolean;
  controlledSubstance: boolean;
  isSystemSchedule: boolean;
  isActive: boolean;
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  version: number;
}

export function toMedicineScheduleResponse(
  schedule: MedicineSchedule,
): MedicineScheduleResponse {
  return {
    id: schedule.id.toString(),
    uuid: schedule.uuid,
    scheduleCode: schedule.scheduleCode,
    scheduleName: schedule.scheduleName,
    description: schedule.description,
    requiresPrescription: schedule.requiresPrescription,
    requiresDoctorDetails: schedule.requiresDoctorDetails,
    maintainSalesRegister: schedule.maintainSalesRegister,
    controlledSubstance: schedule.controlledSubstance,
    isSystemSchedule: schedule.isSystemSchedule,
    isActive: schedule.isActive,
    createdAt: schedule.createdAt,
    updatedAt: schedule.updatedAt,
    deletedAt: schedule.deletedAt,
    version: schedule.version,
  };
}
