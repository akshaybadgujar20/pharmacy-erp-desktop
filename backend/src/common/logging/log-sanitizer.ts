import { Prisma } from '@prisma/client';

const SENSITIVE_KEY_PATTERNS = [
  'password',
  'pin',
  'token',
  'secret',
  'authorization',
  'apikey',
  'api_key',
];

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return SENSITIVE_KEY_PATTERNS.some((pattern) => normalized.includes(pattern));
}

export function safeSerializeValue(value: unknown): unknown {
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

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => safeSerializeValue(item));
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    for (const [key, nested] of Object.entries(record)) {
      if (isSensitiveKey(key)) {
        result[key] = '[REDACTED]';
        continue;
      }
      result[key] = safeSerializeValue(nested);
    }

    return result;
  }

  return value;
}

export function redactSensitiveFields<T extends Record<string, unknown>>(
  meta: T,
): T {
  return safeSerializeValue(meta) as T;
}
