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

export function buildPagination(
  total: number,
  page: number,
  pageSize: number,
): Pagination {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize) || 0,
  };
}
