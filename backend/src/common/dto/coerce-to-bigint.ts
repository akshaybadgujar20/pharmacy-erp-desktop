const BIGINT_STRING_PATTERN = /^\d+$/;

const BIGINT_MIN = 0n;
const BIGINT_MAX = 9223372036854775807n;

export function coerceToBigInt(value: unknown): bigint | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'bigint') {
    return value >= BIGINT_MIN && value <= BIGINT_MAX ? value : undefined;
  }

  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value < 0) {
      return undefined;
    }

    const result = BigInt(value);

    return result <= BIGINT_MAX ? result : undefined;
  }

  if (typeof value === 'string') {
    if (!BIGINT_STRING_PATTERN.test(value)) {
      return undefined;
    }

    const result = BigInt(value);

    return result <= BIGINT_MAX ? result : undefined;
  }

  return undefined;
}
