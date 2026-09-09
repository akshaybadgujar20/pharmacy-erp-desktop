export const UnitType = {
  COUNT: 'COUNT',
  PACK: 'PACK',
  VOLUME: 'VOLUME',
  WEIGHT: 'WEIGHT',
} as const;

export type UnitType = (typeof UnitType)[keyof typeof UnitType];

export const CATEGORY_HIERARCHY_MAX_DEPTH = 100;
