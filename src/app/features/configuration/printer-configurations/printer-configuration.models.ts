export const PRINTER_TYPE_OPTIONS = [
  { label: 'Laser', value: 'LASER' },
  { label: 'Thermal', value: 'THERMAL' },
  { label: 'Label', value: 'LABEL' },
  { label: 'Dot Matrix', value: 'DOT_MATRIX' },
  { label: 'PDF', value: 'PDF' },
];

export const PRINTER_DOCUMENT_TYPE_OPTIONS = [
  { label: 'Sales Invoice', value: 'SALES_INVOICE' },
  { label: 'Purchase Invoice', value: 'PURCHASE_INVOICE' },
  { label: 'Purchase Order', value: 'PURCHASE_ORDER' },
  { label: 'Receipt', value: 'RECEIPT' },
  { label: 'Payment', value: 'PAYMENT' },
  { label: 'Label', value: 'LABEL' },
  { label: 'Barcode Label', value: 'BARCODE_LABEL' },
  { label: 'Prescription', value: 'PRESCRIPTION' },
  { label: 'Report', value: 'REPORT' },
];

export const PRINT_ORIENTATION_OPTIONS = [
  { label: 'Portrait', value: 'PORTRAIT' },
  { label: 'Landscape', value: 'LANDSCAPE' },
];

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
  version: string;
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
  version: string;
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
