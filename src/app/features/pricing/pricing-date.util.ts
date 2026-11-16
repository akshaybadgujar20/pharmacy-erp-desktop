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

export function dateToEpochMs(value: Date | null): string {
  if (!value) {
    return '';
  }
  return String(value.getTime());
}

export function optionalDateToEpochMs(value: Date | null): string | undefined {
  if (!value) {
    return undefined;
  }
  return String(value.getTime());
}

export function nullableDateToEpochMs(value: Date | null): string | null {
  if (!value) {
    return null;
  }
  return String(value.getTime());
}

export function epochToDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  const millis = Number(value);
  if (!Number.isNaN(millis)) {
    return new Date(millis);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
