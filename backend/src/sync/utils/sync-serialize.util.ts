/** Convert entity row fields to JSON-safe sync payload (BigInt → string). */
export function serializeRowForSync(
  row: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (typeof value === 'bigint') {
      out[key] = value.toString();
      continue;
    }
    if (value != null && typeof value === 'object' && 'toFixed' in value) {
      out[key] = String(value);
      continue;
    }
    out[key] = value;
  }
  return out;
}
