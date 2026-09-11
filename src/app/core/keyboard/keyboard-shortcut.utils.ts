import { KeyBinding } from './keyboard-shortcut.types';

const DISPLAY_KEY_MAP: Record<string, string> = {
  escape: 'Esc',
  ' ': 'Space',
  arrowup: '↑',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
};

export function normalizeBindingKey(key: string): string {
  return key.length === 1 ? key.toLowerCase() : key;
}

export function formatBinding(binding: KeyBinding): string {
  const parts: string[] = [];

  if (binding.ctrl) {
    parts.push('Ctrl');
  }
  if (binding.alt) {
    parts.push('Alt');
  }
  if (binding.shift) {
    parts.push('Shift');
  }

  const normalizedKey = normalizeBindingKey(binding.key);
  const displayKey =
    DISPLAY_KEY_MAP[normalizedKey.toLowerCase()] ??
    (normalizedKey.length === 1 ? normalizedKey.toUpperCase() : normalizedKey);

  parts.push(displayKey);
  return parts.join('+');
}

export function bindingsEqual(a: KeyBinding, b: KeyBinding): boolean {
  return (
    normalizeBindingKey(a.key) === normalizeBindingKey(b.key) &&
    Boolean(a.ctrl) === Boolean(b.ctrl) &&
    Boolean(a.shift) === Boolean(b.shift) &&
    Boolean(a.alt) === Boolean(b.alt)
  );
}

export function bindingFromKeyboardEvent(event: KeyboardEvent): KeyBinding | null {
  const key = event.key;

  if (!key || key === 'Control' || key === 'Shift' || key === 'Alt' || key === 'Meta') {
    return null;
  }

  return {
    key: key.length === 1 ? key.toLowerCase() : key,
    ctrl: event.ctrlKey,
    shift: event.shiftKey,
    alt: event.altKey,
  };
}
