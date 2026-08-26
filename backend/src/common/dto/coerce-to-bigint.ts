const BIGINT_STRING_PATTERN = /^\d+$/;
const MAX_BIGINT_DIGITS = 20;

export function coerceToBigInt(value: unknown): bigint | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value === 'bigint') {
    return value;
  }
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
    return BigInt(value);
  }
  if (typeof value === 'string' && BIGINT_STRING_PATTERN.test(value)) {
    if (value.length > MAX_BIGINT_DIGITS) {
      return undefined;
    }
    return BigInt(value);
  }
  return undefined;
}
