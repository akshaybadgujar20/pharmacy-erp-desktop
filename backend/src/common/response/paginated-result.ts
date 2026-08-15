import { Pagination } from './api-response.types';

export interface PaginatedResult<T> {
  data: T[];
  pagination: Pagination;
}

export function isPaginatedResult<T>(
  value: unknown,
): value is PaginatedResult<T> {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const result = value as Record<string, unknown>;

  return (
    Array.isArray(result['data']) &&
    typeof result['pagination'] === 'object' &&
    result['pagination'] !== null
  );
}
