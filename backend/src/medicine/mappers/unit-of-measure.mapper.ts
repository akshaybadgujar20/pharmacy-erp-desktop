import { UnitOfMeasure } from '@prisma/client';

export interface UnitOfMeasureResponse {
  id: string;
  uuid: string;
  unitCode: string;
  unitName: string;
  shortName: string;
  unitType: string;
  decimalAllowed: boolean;
  description: string | null;
  isSystemUnit: boolean;
  isActive: boolean;
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  version: string;
}

export function toUnitOfMeasureResponse(
  unit: UnitOfMeasure,
): UnitOfMeasureResponse {
  return {
    id: unit.id.toString(),
    uuid: unit.uuid,
    unitCode: unit.unitCode,
    unitName: unit.unitName,
    shortName: unit.shortName,
    unitType: unit.unitType,
    decimalAllowed: unit.decimalAllowed,
    description: unit.description,
    isSystemUnit: unit.isSystemUnit,
    isActive: unit.isActive,
    createdAt: unit.createdAt,
    updatedAt: unit.updatedAt,
    deletedAt: unit.deletedAt,
    version: unit.version.toString(),
  };
}
