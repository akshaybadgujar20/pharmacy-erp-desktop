import { Injectable, signal } from '@angular/core';

export interface KeyboardShortcut {
  id: string;
  label: string;
  description: string;
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
}

@Injectable({ providedIn: 'root' })
export class KeyboardShortcutService {
  private readonly shortcuts = new Map<string, KeyboardShortcut>();
  readonly helpVisible = signal(false);

  constructor() {
    this.registerDefaults();
    window.addEventListener('keydown', (event) => this.onKeyDown(event));
  }

  register(shortcut: KeyboardShortcut): void {
    this.shortcuts.set(shortcut.id, shortcut);
  }

  unregister(id: string): void {
    this.shortcuts.delete(id);
  }

  list(): KeyboardShortcut[] {
    return [...this.shortcuts.values()];
  }

  toggleHelp(): void {
    this.helpVisible.update((visible) => !visible);
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (this.isTypingTarget(event.target)) {
      if (event.key === 'Escape') {
        this.helpVisible.set(false);
      }
      return;
    }

    if (event.key === '?' || event.key === 'F1') {
      event.preventDefault();
      this.toggleHelp();
      return;
    }

    for (const shortcut of this.shortcuts.values()) {
      if (this.matches(event, shortcut)) {
        event.preventDefault();
        shortcut.handler();
        return;
      }
    }
  }

  private matches(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
    const key = event.key.toLowerCase();
    const expectedKey = shortcut.key.toLowerCase();

    return (
      key === expectedKey &&
      event.ctrlKey === Boolean(shortcut.ctrl) &&
      event.shiftKey === Boolean(shortcut.shift) &&
      event.altKey === Boolean(shortcut.alt)
    );
  }

  private isTypingTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    const tag = target.tagName.toLowerCase();
    return (
      tag === 'input' ||
      tag === 'textarea' ||
      tag === 'select' ||
      target.isContentEditable
    );
  }

  private registerDefaults(): void {
    const noop = () => undefined;

    this.register({
      id: 'new-sale',
      label: 'F2',
      description: 'keyboard.newSale',
      key: 'F2',
      handler: noop,
    });
    this.register({
      id: 'search-medicine',
      label: 'F4',
      description: 'keyboard.searchMedicine',
      key: 'F4',
      handler: noop,
    });
    this.register({
      id: 'payment',
      label: 'F8',
      description: 'keyboard.payment',
      key: 'F8',
      handler: noop,
    });
    this.register({
      id: 'save',
      label: 'Ctrl+S',
      description: 'keyboard.save',
      key: 's',
      ctrl: true,
      handler: noop,
    });
    this.register({
      id: 'cancel',
      label: 'Esc',
      description: 'keyboard.cancel',
      key: 'Escape',
      handler: () => this.helpVisible.set(false),
    });
  }
}
