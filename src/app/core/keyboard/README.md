# Keyboard Shortcuts

Global keyboard shortcut registry for pharmacy ERP screens.

## Location

```text
src/app/core/keyboard/
```

Dialog UI: `src/app/shared/components/keyboard-shortcuts/`  
Tooltips: `src/app/shared/keyboard/`

## Active screen delegation

Shell (`main-layout`) wires global shortcuts to the active screen:

| Shortcut id | Service |
|-------------|---------|
| `global.save` | `ActiveScreenSaveService.save()` |
| `global.search` | `ActiveScreenSearchService.focus()` |
| `global.print` | `ActiveScreenPrintService.print()` |

List/detail screens register callbacks while they are active.

## List screens

```typescript
import { bindListScreenShortcuts, KeyboardShortcutService } from '../../core/keyboard';
import { ActiveScreenSearchService } from '../../core/services/active-screen-search.service';

this.listBinding = bindListScreenShortcuts(this.shortcuts, this.activeSearch, {
  refresh: () => this.load(),
  create: () => this.onNew(),
  focusSearch: () => this.grid()?.focusSearch(),
});

ngOnDestroy() {
  this.listBinding?.unregister();
}
```

Set `shortcutId` on toolbar config items. `app-toolbar` shows inline `<kbd>` plus a tooltip.

## Detail screens

```typescript
import { bindDetailScreenShortcuts } from '../../core/keyboard';

this.detailBinding = bindDetailScreenShortcuts(
  this.shortcuts,
  this.activeSave,
  this.activePrint,
  {
    save: () => this.save(),
    delete: () => this.deleteRecord(),
    cancel: () => this.goBack(),
    print: () => this.print(), // optional
  },
);
```

Use `appShortcutTooltip` on Save / Delete / Back buttons.

## Dialog access

- Header keyboard button
- `?` or `F1` from anywhere (except text inputs)

Overrides persist in `localStorage` under `app-keyboard-shortcuts:overrides`.

## Dispatch priority

When multiple shortcut ids share the same key (e.g. `sales.new` and `global.lookup` on F2), the handler for the **domain-specific** id wins if it is registered on the active screen.

Add new definitions in `keyboard-shortcut.constants.ts` and i18n keys under `keyboard.*`.