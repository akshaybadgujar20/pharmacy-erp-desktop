export interface MedicineSalt {
  id: string;
  uuid: string;
  medicineId: string;
  saltCompositionId: string;
  medicineGenericId: string | null;
  sequenceNo: number;
  percentage: string | null;
  version: string;
}

export interface CreateMedicineSaltRequest {
  saltCompositionId: string;
  sequenceNo: number;
  percentage?: string | null;
}

export interface UpdateMedicineSaltRequest {
  version: string;
  saltCompositionId?: string;
  sequenceNo?: number;
  percentage?: string | null;
}
