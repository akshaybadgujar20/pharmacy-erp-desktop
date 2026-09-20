import { BarcodeConfiguration } from '@prisma/client';
import {
  serializeDecimal,
  serializeEpochMs,
  serializeOptionalBigInt,
} from '../utils/configuration.util';

export interface BarcodeConfigurationResponse {
  id: string;
  uuid: string;
  companyId: string;
  branchId: string | null;
  configurationName: string;
  barcodeType: string;
  appliesTo: string;
  labelWidth: string;
  labelHeight: string;
  dpi: number;
  showHumanReadableText: boolean;
  template: string | null;
  isDefault: boolean;
  isActive: boolean;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: string;
}

export function toBarcodeConfigurationResponse(
  barcodeConfiguration: BarcodeConfiguration,
): BarcodeConfigurationResponse {
  return {
    id: barcodeConfiguration.id.toString(),
    uuid: barcodeConfiguration.uuid,
    companyId: barcodeConfiguration.companyId.toString(),
    branchId: serializeOptionalBigInt(barcodeConfiguration.branchId),
    configurationName: barcodeConfiguration.configurationName,
    barcodeType: barcodeConfiguration.barcodeType,
    appliesTo: barcodeConfiguration.appliesTo,
    labelWidth: serializeDecimal(barcodeConfiguration.labelWidth) ?? '0',
    labelHeight: serializeDecimal(barcodeConfiguration.labelHeight) ?? '0',
    dpi: barcodeConfiguration.dpi,
    showHumanReadableText: barcodeConfiguration.showHumanReadableText,
    template: barcodeConfiguration.template,
    isDefault: barcodeConfiguration.isDefault,
    isActive: barcodeConfiguration.isActive,
    remarks: barcodeConfiguration.remarks,
    createdAt: serializeEpochMs(barcodeConfiguration.createdAt) ?? '',
    updatedAt: serializeEpochMs(barcodeConfiguration.updatedAt) ?? '',
    deletedAt: serializeEpochMs(barcodeConfiguration.deletedAt),
    version: barcodeConfiguration.version.toString(),
  };
}
