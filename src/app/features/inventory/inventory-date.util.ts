export function toEpochMs(isoDate: string): string {
  return String(new Date(isoDate).getTime());
}

export function optionalEpochMs(isoDate: string): string | undefined {
  if (!isoDate.trim()) {
    return undefined;
  }
  return toEpochMs(isoDate);
}

export function nullableEpochMs(isoDate: string): string | null | undefined {
  if (!isoDate.trim()) {
    return null;
  }
  return toEpochMs(isoDate);
}
