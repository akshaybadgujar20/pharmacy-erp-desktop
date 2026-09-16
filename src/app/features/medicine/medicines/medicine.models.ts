export interface Medicine {
  id: string;
  uuid: string;
  medicineCode: string;
  medicineName: string;
  manufacturerId: string;
  categoryId: string;
  scheduleId: string | null;
  unitId: string;
  brandName: string | null;
  strength: string | null;
  dosageForm: string;
  packSize: string | null;
  hsnCode: string | null;
  barcode: string | null;
  requiresPrescription: boolean;
  narcoticDrug: boolean;
  refrigerated: boolean;
  discontinued: boolean;
  isActive: boolean;
  version: number;
}

export interface CreateMedicineRequest {
  medicineCode: string;
  medicineName: string;
  manufacturerId: string;
  categoryId: string;
  scheduleId?: string;
  unitId: string;
  brandName?: string;
  strength?: string;
  dosageForm: string;
  packSize?: string;
  hsnCode?: string;
  barcode?: string;
  requiresPrescription?: boolean;
  narcoticDrug?: boolean;
  refrigerated?: boolean;
  discontinued?: boolean;
  isActive?: boolean;
}

export interface UpdateMedicineRequest {
  version: number;
  medicineName?: string;
  manufacturerId?: string;
  categoryId?: string;
  scheduleId?: string | null;
  unitId?: string;
  brandName?: string;
  strength?: string;
  dosageForm?: string;
  packSize?: string;
  hsnCode?: string;
  barcode?: string;
  requiresPrescription?: boolean;
  narcoticDrug?: boolean;
  refrigerated?: boolean;
  discontinued?: boolean;
  isActive?: boolean;
}
