import { ShortcutDefinition } from './keyboard-shortcut.types';

export const DEFAULT_SHORTCUT_DEFINITIONS: ShortcutDefinition[] = [
  {
    id: 'global.search',
    description: 'keyboard.search',
    category: 'global',
    defaultBinding: { key: 'f', ctrl: true },
  },
  {
    id: 'global.new',
    description: 'keyboard.new',
    category: 'global',
    defaultBinding: { key: 'n', ctrl: true },
  },
  {
    id: 'global.save',
    description: 'keyboard.save',
    category: 'global',
    defaultBinding: { key: 's', ctrl: true },
  },
  {
    id: 'global.print',
    description: 'keyboard.print',
    category: 'global',
    defaultBinding: { key: 'p', ctrl: true },
  },
  {
    id: 'global.delete',
    description: 'keyboard.delete',
    category: 'global',
    defaultBinding: { key: 'd', ctrl: true },
  },
  {
    id: 'global.refresh',
    description: 'keyboard.refresh',
    category: 'global',
    defaultBinding: { key: 'F5' },
  },
  {
    id: 'global.lookup',
    description: 'keyboard.lookup',
    category: 'global',
    defaultBinding: { key: 'F2' },
  },
  {
    id: 'global.history',
    description: 'keyboard.history',
    category: 'global',
    defaultBinding: { key: 'F4' },
  },
  {
    id: 'global.cancel',
    description: 'keyboard.cancel',
    category: 'global',
    defaultBinding: { key: 'Escape' },
  },
  {
    id: 'sales.new',
    description: 'keyboard.newSale',
    category: 'sales',
    defaultBinding: { key: 'F2' },
  },
  {
    id: 'sales.payment',
    description: 'keyboard.payment',
    category: 'sales',
    defaultBinding: { key: 'F8' },
  },
];

export const SHORTCUT_CATEGORY_ORDER: ShortcutDefinition['category'][] = [
  'global',
  'sales',
  'purchase',
  'inventory',
  'masters',
];
