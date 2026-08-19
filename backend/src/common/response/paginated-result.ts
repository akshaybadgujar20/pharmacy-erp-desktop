import { Pagination } from './api-response.types';

export class PaginatedResult<T> {
  constructor(
    readonly data: T[],
    readonly pagination: Pagination,
  ) {}

  static of<T>(data: T[], pagination: Pagination): PaginatedResult<T> {
    return new PaginatedResult(data, pagination);
  }
}

export function isPaginatedResult<T>(
  value: unknown,
): value is PaginatedResult<T> {
  return value instanceof PaginatedResult;
}
