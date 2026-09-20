import { MedicineCategory } from '@prisma/client';
import { serializeBigInt } from '../utils/medicine.util';

export interface MedicineCategoryResponse {
  id: string;
  uuid: string;
  parentCategoryId: string | null;
  categoryCode: string;
  categoryName: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  version: string;
}

export function toMedicineCategoryResponse(
  category: MedicineCategory,
): MedicineCategoryResponse {
  return {
    id: category.id.toString(),
    uuid: category.uuid,
    parentCategoryId: serializeBigInt(category.parentCategoryId),
    categoryCode: category.categoryCode,
    categoryName: category.categoryName,
    description: category.description,
    displayOrder: category.displayOrder,
    isActive: category.isActive,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
    deletedAt: category.deletedAt,
    version: category.version.toString(),
  };
}
