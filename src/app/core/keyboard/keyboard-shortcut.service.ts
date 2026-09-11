import { Injectable, signal } from '@angular/core';
import {
  DEFAULT_SHORTCUT_DEFINITIONS,
  SHORTCUT_CATEGORY_ORDER,
} from './keyboard-shortcut.constants';
import {
  clearOverrides,
  exportOverrides,
  loadOverrides,
  saveOverrides,
} from './keyboard-shortcut.storage';
import {
  BindingUpdateResult,
  KeyBinding,
  ShortcutCategoryGroup,
  ShortcutDefinition,
  ShortcutHandler,
  ShortcutOverrideMap,
  ShortcutViewModel,
} from './keyboard-shortcut.types';
import { bindingsEqual, formatBinding, normalizeBindingKey } from './keyboard-shortcut.utils';

@Injectable({ providedIn: 'root' })
export class KeyboardShortcutService {
  private readonly definitions = new Map<string, ShortcutDefinition>();
  private readonly handlers = new Map<string, ShortcutHandler>();
  private readonly overrides: ShortcutOverrideMap = loadOverrides();

  readonly dialogVisible = signal(false);
  readonly bindingsChanged = signal(0);

  constructor() {
    for (const definition of DEFAULT_SHORTCUT_DEFINITIONS) {
      this.definitions.set(definition.id, definition);
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (event) => this.onKeyDown(event));
    }
  }

  registerHandler(id: string, handler: ShortcutHandler): void {
    this.handlers.set(id, handler);
  }

  unregisterHandler(id: string): void {
    this.handlers.delete(id);
  }

  getLabel(id: string): string | undefined {
    const definition = this.definitions.get(id);
    if (!definition) {
      return undefined;
    }
    return formatBinding(this.resolveBinding(definition));
  }

  getById(id: string): ShortcutViewModel | undefined {
    const definition = this.definitions.get(id);
    if (!definition) {
      return undefined;
    }
    return this.toViewModel(definition);
  }

  list(): ShortcutViewModel[] {
    return [...this.definitions.values()].map((definition) => this.toViewModel(definition));
  }

  listByCategory(): ShortcutCategoryGroup[] {
    const grouped = new Map<string, ShortcutViewModel[]>();

    for (const definition of this.definitions.values()) {
      const viewModel = this.toViewModel(definition);
      const items = grouped.get(definition.category) ?? [];
      items.push(viewModel);
      grouped.set(definition.category, items);
    }

    return SHORTCUT_CATEGORY_ORDER
      .filter((category) => grouped.has(category))
      .map((category) => ({
        category,
        shortcuts: grouped.get(category) ?? [],
      }));
  }

  updateBinding(id: string, binding: KeyBinding): BindingUpdateResult {
    const definition = this.definitions.get(id);
    if (!definition) {
      return { ok: false, conflictId: '' };
    }

    const conflict = this.findConflict(id, binding);
    if (conflict) {
      return { ok: false, conflictId: conflict };
    }

    if (bindingsEqual(binding, definition.defaultBinding)) {
      delete this.overrides[id];
    } else {
      this.overrides[id] = binding;
    }

    this.persistOverrides();
    this.bindingsChanged.update((value) => value + 1);
    return { ok: true };
  }

  resetBinding(id: string): void {
    if (!this.definitions.has(id)) {
      return;
    }

    delete this.overrides[id];
    this.persistOverrides();
    this.bindingsChanged.update((value) => value + 1);
  }

  resetAllBindings(): void {
    for (const id of Object.keys(this.overrides)) {
      delete this.overrides[id];
    }
    clearOverrides();
    this.bindingsChanged.update((value) => value + 1);
  }

  loadBindings(bindings: ShortcutOverrideMap): void {
    for (const id of Object.keys(this.overrides)) {
      delete this.overrides[id];
    }

    for (const [id, binding] of Object.entries(bindings)) {
      if (this.definitions.has(id)) {
        this.overrides[id] = binding;
      }
    }

    this.persistOverrides();
    this.bindingsChanged.update((value) => value + 1);
  }

  exportBindings(): ShortcutOverrideMap {
    return exportOverrides(this.overrides);
  }

  openDialog(): void {
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
  }

  toggleDialog(): void {
    this.dialogVisible.update((visible) => !visible);
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (this.dialogVisible()) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.closeDialog();
      }
      return;
    }

    if (this.isTypingTarget(event.target)) {
      if (event.key === 'Escape') {
        this.closeDialog();
      }
      return;
    }

    if (event.key === '?' || event.key === 'F1') {
      event.preventDefault();
      this.toggleDialog();
      return;
    }

    for (const definition of this.definitions.values()) {
      const binding = this.resolveBinding(definition);
      if (this.matches(event, binding)) {
        event.preventDefault();
        const handler = this.handlers.get(definition.id);
        if (handler) {
          handler();
        } else if (definition.id === 'global.cancel') {
          this.closeDialog();
        }
        return;
      }
    }
  }

  private matches(event: KeyboardEvent, binding: KeyBinding): boolean {
    const eventKey = normalizeBindingKey(event.key);
    const expectedKey = normalizeBindingKey(binding.key);

    return (
      eventKey === expectedKey &&
      event.ctrlKey === Boolean(binding.ctrl) &&
      event.shiftKey === Boolean(binding.shift) &&
      event.altKey === Boolean(binding.alt)
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

  private resolveBinding(definition: ShortcutDefinition): KeyBinding {
    return this.overrides[definition.id] ?? definition.defaultBinding;
  }

  private toViewModel(definition: ShortcutDefinition): ShortcutViewModel {
    const binding = this.resolveBinding(definition);
    const isOverridden = Boolean(this.overrides[definition.id]);

    return {
      id: definition.id,
      description: definition.description,
      category: definition.category,
      binding,
      label: formatBinding(binding),
      hasHandler: this.handlers.has(definition.id),
      isOverridden,
    };
  }

  private findConflict(id: string, binding: KeyBinding): string | null {
    for (const definition of this.definitions.values()) {
      if (definition.id === id) {
        continue;
      }

      if (bindingsEqual(binding, this.resolveBinding(definition))) {
        return definition.id;
      }
    }

    return null;
  }

  private persistOverrides(): void {
    saveOverrides(this.overrides);
  }
}
