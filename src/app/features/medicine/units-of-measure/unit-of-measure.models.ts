export const UNIT_TYPES = ['COUNT', 'PACKAGING', 'VOLUME', 'WEIGHT'] as const;

export type UnitType = (typeof UNIT_TYPES)[number];

export const UNIT_TYPE_OPTIONS = [
  { label: 'Count', value: 'COUNT' },
  { label: 'Packaging', value: 'PACKAGING' },
  { label: 'Volume', value: 'VOLUME' },
  { label: 'Weight', value: 'WEIGHT' },
];

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
  version: string;
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
  version: string;
  unitCode?: string;
  unitName?: string;
  shortName?: string;
  unitType?: string;
  decimalAllowed?: boolean;
  description?: string;
  isSystemUnit?: boolean;
  isActive?: boolean;
}
