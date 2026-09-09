export const PriceListType = {
  RETAIL: 'RETAIL',
  WHOLESALE: 'WHOLESALE',
  HOSPITAL: 'HOSPITAL',
  DISTRIBUTOR: 'DISTRIBUTOR',
  CORPORATE: 'CORPORATE',
  PROMOTIONAL: 'PROMOTIONAL',
} as const;

export const DiscountType = {
  PERCENT: 'PERCENT',
  FLAT: 'FLAT',
} as const;

export const AppliesTo = {
  MEDICINE: 'MEDICINE',
  CATEGORY: 'CATEGORY',
  CUSTOMER: 'CUSTOMER',
  PRICE_LIST: 'PRICE_LIST',
  GLOBAL: 'GLOBAL',
} as const;

export const TaxType = {
  GST: 'GST',
  CGST: 'CGST',
  SGST: 'SGST',
  IGST: 'IGST',
  CESS: 'CESS',
} as const;
