export type ShortcutCategory =
  | 'global'
  | 'sales'
  | 'purchase'
  | 'inventory'
  | 'masters';

export interface KeyBinding {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
}

export interface ShortcutDefinition {
  id: string;
  description: string;
  category: ShortcutCategory;
  defaultBinding: KeyBinding;
}

export type ShortcutHandler = () => void;

export type ShortcutOverrideMap = Record<string, KeyBinding>;

export interface ShortcutViewModel {
  id: string;
  description: string;
  category: ShortcutCategory;
  binding: KeyBinding;
  label: string;
  hasHandler: boolean;
  isOverridden: boolean;
}

export interface ShortcutCategoryGroup {
  category: ShortcutCategory;
  shortcuts: ShortcutViewModel[];
}

export type BindingUpdateResult =
  | { ok: true }
  | { ok: false; conflictId: string };
