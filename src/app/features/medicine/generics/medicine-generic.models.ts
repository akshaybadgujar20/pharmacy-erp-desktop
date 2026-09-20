export interface MedicineGeneric {
  id: string;
  uuid: string;
  genericCode: string;
  genericName: string;
  therapeuticClass: string | null;
  pharmacologicalClass: string | null;
  description: string | null;
  isActive: boolean;
  version: string;
}

export interface CreateMedicineGenericRequest {
  genericCode: string;
  genericName: string;
  therapeuticClass?: string;
  pharmacologicalClass?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateMedicineGenericRequest {
  version: string;
  genericCode?: string;
  genericName?: string;
  therapeuticClass?: string;
  pharmacologicalClass?: string;
  description?: string;
  isActive?: boolean;
}
