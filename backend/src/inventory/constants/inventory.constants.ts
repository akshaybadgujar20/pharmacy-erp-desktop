export const AddressType = {
  HOME: 'HOME',
  WORK: 'WORK',
  BILLING: 'BILLING',
  SHIPPING: 'SHIPPING',
  REGISTERED: 'REGISTERED',
  OTHER: 'OTHER',
} as const;

export const ContactType = {
  PHONE: 'PHONE',
  MOBILE: 'MOBILE',
  EMAIL: 'EMAIL',
  FAX: 'FAX',
  WHATSAPP: 'WHATSAPP',
  OTHER: 'OTHER',
} as const;

export const CustomerType = {
  RETAIL: 'RETAIL',
  WHOLESALE: 'WHOLESALE',
  CORPORATE: 'CORPORATE',
} as const;

export const SupplierType = {
  MANUFACTURER: 'MANUFACTURER',
  DISTRIBUTOR: 'DISTRIBUTOR',
  WHOLESALER: 'WHOLESALER',
  OTHER: 'OTHER',
} as const;
