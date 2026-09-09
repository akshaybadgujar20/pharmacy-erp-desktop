import { PrinterConfiguration } from '@prisma/client';
import {
  serializeEpochMs,
  serializeOptionalBigInt,
} from '../utils/configuration.util';

export interface PrinterConfigurationResponse {
  id: string;
  uuid: string;
  companyId: string;
  branchId: string | null;
  printerName: string;
  printerType: string;
  documentType: string;
  printerPath: string | null;
  paperSize: string | null;
  copies: number;
  printOrientation: string;
  isDefault: boolean;
  isActive: boolean;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
}

export function toPrinterConfigurationResponse(
  printerConfiguration: PrinterConfiguration,
): PrinterConfigurationResponse {
  return {
    id: printerConfiguration.id.toString(),
    uuid: printerConfiguration.uuid,
    companyId: printerConfiguration.companyId.toString(),
    branchId: serializeOptionalBigInt(printerConfiguration.branchId),
    printerName: printerConfiguration.printerName,
    printerType: printerConfiguration.printerType,
    documentType: printerConfiguration.documentType,
    printerPath: printerConfiguration.printerPath,
    paperSize: printerConfiguration.paperSize,
    copies: printerConfiguration.copies,
    printOrientation: printerConfiguration.printOrientation,
    isDefault: printerConfiguration.isDefault,
    isActive: printerConfiguration.isActive,
    remarks: printerConfiguration.remarks,
    createdAt: serializeEpochMs(printerConfiguration.createdAt) ?? '',
    updatedAt: serializeEpochMs(printerConfiguration.updatedAt) ?? '',
    deletedAt: serializeEpochMs(printerConfiguration.deletedAt),
    version: printerConfiguration.version,
  };
}
