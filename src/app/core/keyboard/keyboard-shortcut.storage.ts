import { KeyBinding, ShortcutOverrideMap } from './keyboard-shortcut.types';

const STORAGE_KEY = 'app-keyboard-shortcuts:overrides';

export function loadOverrides(): ShortcutOverrideMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    return JSON.parse(raw) as ShortcutOverrideMap;
  } catch {
    return {};
  }
}

export function saveOverrides(overrides: ShortcutOverrideMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // ignore storage errors
  }
}

export function clearOverrides(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

export function exportOverrides(overrides: ShortcutOverrideMap): ShortcutOverrideMap {
  return { ...overrides };
}

export function mergeRemoteOverrides(
  current: ShortcutOverrideMap,
  remote: ShortcutOverrideMap,
): ShortcutOverrideMap {
  return { ...current, ...remote };
}

export function isValidKeyBinding(binding: KeyBinding): boolean {
  return Boolean(binding.key?.trim());
}
