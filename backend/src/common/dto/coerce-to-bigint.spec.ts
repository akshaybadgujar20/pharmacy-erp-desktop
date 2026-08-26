import { coerceToBigInt } from './coerce-to-bigint';

describe('coerceToBigInt', () => {
  it('coerces numeric string to bigint', () => {
    expect(coerceToBigInt('38')).toBe(38n);
  });

  it('coerces non-negative integer number to bigint', () => {
    expect(coerceToBigInt(38)).toBe(38n);
  });

  it('returns bigint unchanged', () => {
    expect(coerceToBigInt(38n)).toBe(38n);
  });

  it('returns undefined for empty optional values', () => {
    expect(coerceToBigInt(undefined)).toBeUndefined();
    expect(coerceToBigInt(null)).toBeUndefined();
    expect(coerceToBigInt('')).toBeUndefined();
  });

  it('returns undefined for invalid values', () => {
    expect(coerceToBigInt('abc')).toBeUndefined();
    expect(coerceToBigInt(-1)).toBeUndefined();
    expect(coerceToBigInt(38.5)).toBeUndefined();
  });

  it('returns undefined for overlong digit strings', () => {
    expect(coerceToBigInt('1'.repeat(21))).toBeUndefined();
  });
});
