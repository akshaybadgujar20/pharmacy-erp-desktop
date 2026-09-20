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
