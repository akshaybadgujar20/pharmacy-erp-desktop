import { Prisma } from '@prisma/client';

/**
 * Recursively serializes values for JSON responses (bigint, Decimal, Date).
 * Does not redact sensitive fields — use safeSerializeValue for logging.
 */
export function serializeForJson(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (value instanceof Prisma.Decimal) {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeForJson(item));
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    for (const [key, nested] of Object.entries(record)) {
      result[key] = serializeForJson(nested);
    }

    return result;
  }

  return value;
}
