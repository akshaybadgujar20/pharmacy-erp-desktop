const STORAGE_PREFIX = 'app-grid-state:';

export function saveGridState(storageKey: string, state: unknown): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${storageKey}`, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

export function loadGridState<T>(storageKey: string): T | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${storageKey}`);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function clearGridState(storageKey: string): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${storageKey}`);
  } catch {
    // ignore storage errors
  }
}
