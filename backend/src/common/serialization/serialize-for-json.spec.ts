import { serializeForJson } from './serialize-for-json';

describe('serializeForJson', () => {
  it('serializes bigint to string', () => {
    expect(serializeForJson(42n)).toBe('42');
  });

  it('serializes nested objects with bigint', () => {
    expect(serializeForJson({ id: 1n, name: 'test' })).toEqual({
      id: '1',
      name: 'test',
    });
  });

  it('serializes arrays', () => {
    expect(serializeForJson([1n, 2n])).toEqual(['1', '2']);
  });

  it('returns null and undefined as-is', () => {
    expect(serializeForJson(null)).toBeNull();
    expect(serializeForJson(undefined)).toBeUndefined();
  });
});
