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
  SALES_APPLY_ROUND_OFF: 'sales.apply_round_off',
  SALES_RETURN_WINDOW_DAYS: 'sales.return_window_days',
  SALES_RETURN_REQUIRES_PHARMACIST_FOR_SCHEDULE_H:
    'sales.return_requires_pharmacist_for_schedule_h',
  PRESCRIPTION_MANDATORY_SCHEDULE_H: 'PRESCRIPTION_MANDATORY_SCHEDULE_H',
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
