export interface PrescriptionItem {
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

export interface CreatePrescriptionItemRequest {
  medicineId: string;
  unitId: string;
  lineNumber: number;
  prescribedQuantity: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  route?: string;
  instructions?: string;
  remarks?: string;
}

export interface UpdatePrescriptionItemRequest {
  version: number;
  medicineId?: string;
  unitId?: string;
  lineNumber?: number;
  prescribedQuantity?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  route?: string;
  instructions?: string;
  remarks?: string;
}
