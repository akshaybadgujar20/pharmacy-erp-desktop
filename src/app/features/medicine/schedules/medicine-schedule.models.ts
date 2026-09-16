export interface MedicineSchedule {
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
  version: number;
}

export interface CreateMedicineScheduleRequest {
  scheduleCode: string;
  scheduleName: string;
  description?: string;
  requiresPrescription?: boolean;
  requiresDoctorDetails?: boolean;
  maintainSalesRegister?: boolean;
  controlledSubstance?: boolean;
  isSystemSchedule?: boolean;
  isActive?: boolean;
}

export interface UpdateMedicineScheduleRequest {
  version: number;
  scheduleCode?: string;
  scheduleName?: string;
  description?: string;
  requiresPrescription?: boolean;
  requiresDoctorDetails?: boolean;
  maintainSalesRegister?: boolean;
  controlledSubstance?: boolean;
  isSystemSchedule?: boolean;
  isActive?: boolean;
}
