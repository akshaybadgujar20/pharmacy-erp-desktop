import { FinancialYear } from '@prisma/client';
import {
  serializeEpochMs,
  serializeOptionalBigInt,
} from '../utils/configuration.util';

export interface FinancialYearResponse {
  id: string;
  uuid: string;
  companyId: string;
  branchId: string | null;
  financialYearCode: string;
  financialYearName: string;
  startDate: string;
  endDate: string;
  status: string;
  isCurrent: boolean;
  closingDate: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
}

export function toFinancialYearResponse(
  financialYear: FinancialYear,
): FinancialYearResponse {
  return {
    id: financialYear.id.toString(),
    uuid: financialYear.uuid,
    companyId: financialYear.companyId.toString(),
    branchId: serializeOptionalBigInt(financialYear.branchId),
    financialYearCode: financialYear.financialYearCode,
    financialYearName: financialYear.financialYearName,
    startDate: serializeEpochMs(financialYear.startDate) ?? '',
    endDate: serializeEpochMs(financialYear.endDate) ?? '',
    status: financialYear.status,
    isCurrent: financialYear.isCurrent,
    closingDate: serializeEpochMs(financialYear.closingDate),
    remarks: financialYear.remarks,
    createdAt: serializeEpochMs(financialYear.createdAt) ?? '',
    updatedAt: serializeEpochMs(financialYear.updatedAt) ?? '',
    deletedAt: serializeEpochMs(financialYear.deletedAt),
    version: financialYear.version,
  };
}
