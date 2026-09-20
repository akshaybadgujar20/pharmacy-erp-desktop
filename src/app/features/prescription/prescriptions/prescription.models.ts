export interface Prescription {
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
  version: string;
}

export interface CreatePrescriptionRequest {
  prescriptionNumber: string;
  customerId: string;
  doctorId: string;
  prescriptionDate: string;
  validUntil?: string;
  diagnosis?: string;
  symptoms?: string;
  visitNumber?: string;
  remarks?: string;
}

export interface UpdatePrescriptionRequest {
  version: string;
  prescriptionNumber?: string;
  customerId?: string;
  doctorId?: string;
  prescriptionDate?: string;
  validUntil?: string | null;
  diagnosis?: string;
  symptoms?: string;
  visitNumber?: string;
  remarks?: string;
}

export interface PrescriptionWorkflowRequest {
  version: string;
  remarks?: string;
}
