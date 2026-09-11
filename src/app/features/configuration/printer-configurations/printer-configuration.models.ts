export interface PrinterConfiguration {
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

export interface CreatePrinterConfigurationRequest {
  branchId?: string;
  printerName: string;
  printerType: string;
  documentType: string;
  printerPath?: string;
  paperSize?: string;
  copies?: number;
  printOrientation?: string;
  isDefault?: boolean;
  isActive?: boolean;
  remarks?: string;
}

export interface UpdatePrinterConfigurationRequest {
  version: number;
  branchId?: string;
  printerName?: string;
  printerType?: string;
  documentType?: string;
  printerPath?: string;
  paperSize?: string;
  copies?: number;
  printOrientation?: string;
  isDefault?: boolean;
  isActive?: boolean;
  remarks?: string;
}
