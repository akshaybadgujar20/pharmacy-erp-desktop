import { ApiClientError } from '../models/api-response.types';

const FRIENDLY_BY_CODE: Record<string, string> = {
  FINANCIAL_YEAR_CLOSED:
    'This document date falls in a closed financial year. Choose an open period or contact an administrator.',
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
