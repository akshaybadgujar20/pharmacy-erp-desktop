import { ApiClientError } from '../models/api-response.types';

const FRIENDLY_BY_CODE: Record<string, string> = {
  FINANCIAL_YEAR_CLOSED:
    'This document date falls in a closed financial year. Choose an open period or contact an administrator.',
  SCHEDULE_H_PRESCRIPTION_REQUIRED:
    'A valid prescription is required for this medicine (Schedule H).',
  PRESCRIPTION_NOT_FOUND: 'Prescription not found for this branch.',
  PRESCRIPTION_QUANTITY_EXCEEDED:
    'Dispensed quantity exceeds the remaining amount on the prescription.',
  PRESCRIPTION_NOT_DRAFT: 'Prescription cannot be changed in its current status.',
  LOYALTY_INSUFFICIENT_POINTS: 'Not enough loyalty points for this redemption.',
  LOYALTY_MEMBERSHIP_NOT_FOUND: 'Customer is not enrolled in a loyalty program.',
  LOYALTY_PROGRAM_NOT_FOUND: 'Loyalty program not found.',
  BATCH_EXPIRED: 'Selected batch is expired for this sale date.',
};

/** Maps API errors to user-facing messages (prefer error code over raw server text). */
export function resolveApiErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return FRIENDLY_BY_CODE[error.code] ?? error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Request failed';
}
