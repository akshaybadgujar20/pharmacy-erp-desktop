export const BARCODE_TYPE_OPTIONS = [
  { label: 'Code 128', value: 'CODE128' },
  { label: 'Code 39', value: 'CODE39' },
  { label: 'EAN-13', value: 'EAN13' },
  { label: 'EAN-8', value: 'EAN8' },
  { label: 'QR', value: 'QR' },
  { label: 'QR Code', value: 'QR_CODE' },
  { label: 'Data Matrix', value: 'DATA_MATRIX' },
];

export const BARCODE_APPLIES_TO_OPTIONS = [
  { label: 'Medicine', value: 'MEDICINE' },
  { label: 'Batch', value: 'BATCH' },
  { label: 'Shelf', value: 'SHELF' },
  { label: 'Invoice', value: 'INVOICE' },
  { label: 'Customer', value: 'CUSTOMER' },
];

export interface BarcodeConfiguration {
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

export interface CreateBarcodeConfigurationRequest {
  branchId?: string;
  configurationName: string;
  barcodeType: string;
  appliesTo: string;
  labelWidth: string;
  labelHeight: string;
  dpi?: number;
  showHumanReadableText?: boolean;
  template?: string;
  isDefault?: boolean;
  isActive?: boolean;
  remarks?: string;
}

export interface UpdateBarcodeConfigurationRequest {
  version: string;
  branchId?: string;
  configurationName?: string;
  barcodeType?: string;
  appliesTo?: string;
  labelWidth?: string;
  labelHeight?: string;
  dpi?: number;
  showHumanReadableText?: boolean;
  template?: string;
  isDefault?: boolean;
  isActive?: boolean;
  remarks?: string;
}
