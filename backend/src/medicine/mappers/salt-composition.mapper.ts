import { SaltComposition } from '@prisma/client';
import { serializeDecimal } from '../utils/medicine.util';

export interface SaltCompositionResponse {
  id: string;
  uuid: string;
  genericId: string;
  unitId: string;
  compositionCode: string;
  strength: string;
  strengthUnit: string;
  description: string | null;
  isActive: boolean;
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  version: string;
}

export function toSaltCompositionResponse(
  saltComposition: SaltComposition,
): SaltCompositionResponse {
  return {
    id: saltComposition.id.toString(),
    uuid: saltComposition.uuid,
    genericId: saltComposition.genericId.toString(),
    unitId: saltComposition.unitId.toString(),
    compositionCode: saltComposition.compositionCode,
    strength: serializeDecimal(saltComposition.strength) ?? '0',
    strengthUnit: saltComposition.strengthUnit,
    description: saltComposition.description,
    isActive: saltComposition.isActive,
    createdAt: saltComposition.createdAt,
    updatedAt: saltComposition.updatedAt,
    deletedAt: saltComposition.deletedAt,
    version: saltComposition.version.toString(),
  };
}
