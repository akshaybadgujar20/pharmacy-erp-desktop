export const UNIT_TYPES = ['COUNT', 'PACKAGING', 'VOLUME', 'WEIGHT'] as const;

export type UnitType = (typeof UNIT_TYPES)[number];

export interface UnitOfMeasure {
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
  version: number;
}

export interface CreateUnitOfMeasureRequest {
  unitCode: string;
  unitName: string;
  shortName: string;
  unitType: string;
  decimalAllowed?: boolean;
  description?: string;
  isSystemUnit?: boolean;
  isActive?: boolean;
}

export interface UpdateUnitOfMeasureRequest {
  version: number;
  unitCode?: string;
  unitName?: string;
  shortName?: string;
  unitType?: string;
  decimalAllowed?: boolean;
  description?: string;
  isSystemUnit?: boolean;
  isActive?: boolean;
}
