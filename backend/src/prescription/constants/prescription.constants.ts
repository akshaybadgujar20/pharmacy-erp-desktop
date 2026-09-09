export const PrescriptionStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  PARTIALLY_DISPENSED: 'PARTIALLY_DISPENSED',
  DISPENSED: 'DISPENSED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;

export const PrescriptionItemStatus = {
  PENDING: 'PENDING',
  PARTIALLY_DISPENSED: 'PARTIALLY_DISPENSED',
  DISPENSED: 'DISPENSED',
  CANCELLED: 'CANCELLED',
} as const;

export const PRESCRIPTION_ACTIVATABLE_STATUSES = [
  PrescriptionStatus.DRAFT,
] as const;

export const PRESCRIPTION_CANCELLABLE_STATUSES = [
  PrescriptionStatus.DRAFT,
  PrescriptionStatus.ACTIVE,
] as const;

export const PRESCRIPTION_EXPIRABLE_STATUSES = [
  PrescriptionStatus.ACTIVE,
  PrescriptionStatus.PARTIALLY_DISPENSED,
] as const;
