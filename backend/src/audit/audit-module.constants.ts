export const AuditModule = {
  SALES: 'Sales',
  PURCHASE: 'Purchase',
  INVENTORY: 'Inventory',
  MEDICINE: 'Medicine',
  PARTY: 'Party',
  FINANCE: 'Finance',
  SECURITY: 'Security',
  CONFIGURATION: 'Configuration',
  SYNCHRONIZATION: 'Synchronization',
  PRICING: 'Pricing',
  PRESCRIPTION: 'Prescription',
} as const;

export type AuditModule = (typeof AuditModule)[keyof typeof AuditModule];
