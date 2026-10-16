import type { LoyaltyProgram } from '@prisma/client';
import { serializeDecimal } from '../../party/utils/party.util';

export function toLoyaltyProgramResponse(program: LoyaltyProgram) {
  return {
    id: program.id.toString(),
    uuid: program.uuid,
    programCode: program.programCode,
    programName: program.programName,
    description: program.description,
    pointsPerAmount: serializeDecimal(program.pointsPerAmount),
    redemptionValue: serializeDecimal(program.redemptionValue),
    minimumRedemptionPoints: program.minimumRedemptionPoints,
    maximumRedemptionPoints: program.maximumRedemptionPoints,
    effectiveFrom: program.effectiveFrom.toString(),
    effectiveTo: program.effectiveTo?.toString() ?? null,
    isDefault: program.isDefault,
    isActive: program.isActive,
    version: Number(program.version),
    createdAt: program.createdAt.toString(),
    updatedAt: program.updatedAt.toString(),
  };
}
