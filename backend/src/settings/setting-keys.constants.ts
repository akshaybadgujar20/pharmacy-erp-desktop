export const SettingKey = {
  GST_DEFAULT_RATE: 'gst.default_rate',
  INVOICE_TEMPLATE_ID: 'invoice.template_id',
  BARCODE_FORMAT: 'barcode.format',
  PRINTER_RECEIPT_MAPPING: 'printer.receipt_mapping',
  STORE_DISPLAY_NAME: 'store.display_name',
  PURCHASE_ALLOW_GRN_WITHOUT_PO: 'purchase.allow_grn_without_po',
  SALES_ENFORCE_MRP_CAP: 'sales.enforce_mrp_cap',
  SALES_ALLOW_EXPIRED_SALE: 'sales.allow_expired_sale',
  SALES_ALLOW_EXPIRED_CUSTOMER_RETURN: 'sales.allow_expired_customer_return',
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
  INTEGER: 'INTEGER',
  DECIMAL: 'DECIMAL',
  BOOLEAN: 'BOOLEAN',
  JSON: 'JSON',
} as const;

export type SettingDataType =
  (typeof SettingDataType)[keyof typeof SettingDataType];
