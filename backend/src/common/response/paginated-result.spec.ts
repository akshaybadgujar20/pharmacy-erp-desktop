import { PaginatedResult, isPaginatedResult } from './paginated-result';

describe('PaginatedResult', () => {
  const pagination = { page: 1, pageSize: 10, total: 100, totalPages: 10 };

  it('creates instance via of()', () => {
    const result = PaginatedResult.of(['a', 'b'], pagination);

    expect(result.data).toEqual(['a', 'b']);
    expect(result.pagination).toEqual(pagination);
  });

  it('isPaginatedResult returns true for PaginatedResult instance', () => {
    const result = PaginatedResult.of([], pagination);

    expect(isPaginatedResult(result)).toBe(true);
  });

  it('isPaginatedResult returns false for plain object with same shape', () => {
    const plain = { data: [], pagination };

    expect(isPaginatedResult(plain)).toBe(false);
  });

  it('isPaginatedResult returns false for null and non-objects', () => {
    expect(isPaginatedResult(null)).toBe(false);
    expect(isPaginatedResult(undefined)).toBe(false);
    expect(isPaginatedResult('string')).toBe(false);
  });
});
