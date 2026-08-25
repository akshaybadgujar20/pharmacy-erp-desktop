export const SettingKey = {
  GST_DEFAULT_RATE: 'gst.default_rate',
  INVOICE_TEMPLATE_ID: 'invoice.template_id',
  BARCODE_FORMAT: 'barcode.format',
  PRINTER_RECEIPT_MAPPING: 'printer.receipt_mapping',
  STORE_DISPLAY_NAME: 'store.display_name',
} as const;

export type SettingKey = (typeof SettingKey)[keyof typeof SettingKey];

export const SettingCategory = {
  TAX: 'TAX',
  INVOICE: 'INVOICE',
  BARCODE: 'BARCODE',
  PRINTER: 'PRINTER',
  GENERAL: 'GENERAL',
} as const;

export type SettingCategory =
  (typeof SettingCategory)[keyof typeof SettingCategory];

export const SettingDataType = {
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  BOOLEAN: 'BOOLEAN',
  JSON: 'JSON',
} as const;

export type SettingDataType =
  (typeof SettingDataType)[keyof typeof SettingDataType];
