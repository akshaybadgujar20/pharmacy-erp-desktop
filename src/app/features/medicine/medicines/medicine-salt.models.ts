export interface MedicineSalt {
  id: string;
  uuid: string;
  medicineId: string;
  saltCompositionId: string;
  medicineGenericId: string | null;
  sequenceNo: number;
  percentage: string | null;
  version: number;
}

export interface CreateMedicineSaltRequest {
  saltCompositionId: string;
  sequenceNo: number;
  percentage?: string | null;
}

export interface UpdateMedicineSaltRequest {
  version: number;
  saltCompositionId?: string;
  sequenceNo?: number;
  percentage?: string | null;
}
