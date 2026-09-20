export interface MedicineCategory {
  id: string;
  uuid: string;
  parentCategoryId: string | null;
  categoryCode: string;
  categoryName: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  version: string;
}

export interface CreateMedicineCategoryRequest {
  parentCategoryId?: string;
  categoryCode: string;
  categoryName: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateMedicineCategoryRequest {
  version: string;
  parentCategoryId?: string | null;
  categoryCode?: string;
  categoryName?: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
}
