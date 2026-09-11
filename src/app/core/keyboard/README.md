# Keyboard Shortcuts

Global keyboard shortcut registry for pharmacy ERP screens.

## Location

```text
src/app/core/keyboard/
```

Dialog UI: `src/app/shared/components/keyboard-shortcuts/`

## Usage

### Register handlers in a feature component

```typescript
private readonly shortcuts = inject(KeyboardShortcutService);

ngOnInit() {
  this.shortcuts.registerHandler('global.save', () => this.onSave());
  this.shortcuts.registerHandler('global.refresh', () => this.onRefresh());
}

ngOnDestroy() {
  this.shortcuts.unregisterHandler('global.save');
  this.shortcuts.unregisterHandler('global.refresh');
}
```

### Link toolbar buttons to shortcuts

```typescript
{
  type: 'button',
  id: 'save',
  label: 'Save',
  icon: 'pi pi-save',
  shortcutId: 'global.save',
}
```

`app-toolbar` renders a `<kbd>` chip with the resolved shortcut label.

## Dialog access

- Top-right keyboard button in the app shell header
- `?` or `F1` from anywhere (except text inputs)

Users can remap shortcuts in the dialog. Overrides persist in `localStorage` under `app-keyboard-shortcuts:overrides`.

## Backend sync (future)

```typescript
// After loading user settings from API
shortcutService.loadBindings(serverOverrides);

// When saving user settings
const payload = shortcutService.exportBindings();
```

Handlers are never serialized — only key bindings.

## Default shortcut ids

| id | Default |
|----|---------|
| `global.search` | Ctrl+F |
| `global.new` | Ctrl+N |
| `global.save` | Ctrl+S |
| `global.print` | Ctrl+P |
| `global.delete` | Ctrl+D |
| `global.refresh` | F5 |
| `global.lookup` | F2 |
| `global.history` | F4 |
| `global.cancel` | Esc |
| `sales.new` | F2 |
| `sales.payment` | F8 |

Add new definitions in `keyboard-shortcut.constants.ts` and i18n keys under `keyboard.*`.
