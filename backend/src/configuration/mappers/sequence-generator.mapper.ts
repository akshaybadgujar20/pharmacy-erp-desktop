import { SequenceGenerator } from '@prisma/client';
import {
  serializeEpochMs,
  serializeOptionalBigInt,
} from '../utils/configuration.util';

export interface SequenceGeneratorResponse {
  id: string;
  uuid: string;
  companyId: string;
  branchId: string | null;
  documentType: string;
  prefix: string | null;
  suffix: string | null;
  currentNumber: string;
  incrementBy: number;
  paddingLength: number;
  resetPolicy: string;
  format: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export function toSequenceGeneratorResponse(
  sequenceGenerator: SequenceGenerator,
): SequenceGeneratorResponse {
  return {
    id: sequenceGenerator.id.toString(),
    uuid: sequenceGenerator.uuid,
    companyId: sequenceGenerator.companyId.toString(),
    branchId: serializeOptionalBigInt(sequenceGenerator.branchId),
    documentType: sequenceGenerator.documentType,
    prefix: sequenceGenerator.prefix,
    suffix: sequenceGenerator.suffix,
    currentNumber: sequenceGenerator.currentNumber.toString(),
    incrementBy: sequenceGenerator.incrementBy,
    paddingLength: sequenceGenerator.paddingLength,
    resetPolicy: sequenceGenerator.resetPolicy,
    format: sequenceGenerator.format,
    isActive: sequenceGenerator.isActive,
    createdAt: serializeEpochMs(sequenceGenerator.createdAt) ?? '',
    updatedAt: serializeEpochMs(sequenceGenerator.updatedAt) ?? '',
    version: sequenceGenerator.version,
  };
}
