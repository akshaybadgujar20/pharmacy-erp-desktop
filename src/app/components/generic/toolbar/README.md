# AppToolbar

Configuration-driven toolbar for pharmacy ERP screens. Renders PrimeNG buttons and split buttons from a typed config.

## Location

```text
src/app/components/generic/toolbar/
```

Page-specific configs live next to feature components (e.g. `customer-toolbar.config.ts`).

## Usage

```html
<app-toolbar
  [config]="toolbarConfig"
  [loading]="actionLoading"
  (action)="onToolbarAction($event)"
/>
```

```ts
import { ToolbarConfig } from '../../components/generic/toolbar';

export const toolbarConfig: ToolbarConfig = {
  layout: { direction: 'horizontal', align: 'between' },
  items: [
    { type: 'spacer' },
    {
      type: 'button',
      id: 'create',
      label: 'New Customer',
      icon: 'pi pi-plus',
      permission: 'PARTY:CUSTOMER:CREATE',
      severity: 'primary',
    },
    {
      type: 'splitButton',
      id: 'export',
      label: 'Export',
      icon: 'pi pi-download',
      menuItems: [
        { id: 'export-csv', label: 'CSV' },
        { id: 'export-excel', label: 'Excel' },
      ],
    },
  ],
};
```

## Item types

| type | Description |
|------|-------------|
| `button` | PrimeNG `pButton` |
| `splitButton` | PrimeNG `p-splitbutton` with config menu items |
| `buttonGroup` | Wraps buttons in `p-buttongroup` |
| `separator` | Visual divider |
| `spacer` | Flex spacer for alignment |

## Layout

```ts
layout: {
  direction: 'horizontal' | 'vertical',  // default horizontal
  align: 'start' | 'center' | 'end' | 'between',
  gap: '0.5rem',
  wrap: true,
}
```

## Permissions and roles

| Field | Behavior |
|-------|----------|
| `permission` | Single permission required |
| `permissions` | All required (AND) |
| `anyPermission` | Any required (OR) |
| `role` | Single role required |
| `roles` | Any role required (OR) |

Uses `AuthService.hasPermission()` and `AuthService.hasAnyRole()`.

## Events

```ts
interface ToolbarActionEvent {
  action: string;
  source: 'button' | 'splitButton' | 'menu';
  parentId?: string;
  externalUrl?: string;
}
```

Parent handles all business logic. No handlers in config.

## Loading

```html
<app-toolbar [config]="config" [loading]="{ create: true }" />
```

Sets disabled + spinner for matching action id.

## Keyboard shortcuts

Set `shortcutId` to link a button to a global shortcut from `KeyboardShortcutService`:

```ts
{
  type: 'button',
  id: 'save',
  label: 'Save',
  icon: 'pi pi-save',
  shortcutId: 'global.save',
}
```

The toolbar renders a `<kbd>` chip with the resolved shortcut label (e.g. `Ctrl+S`). Register the handler in the parent component — see [`core/keyboard/README.md`](../../core/keyboard/README.md).

## Rules

- Config defines presentation and generic toolbar behavior only.
- No service callbacks or `command` in page config.
- Confirmation via `confirmation: true` shows generic PrimeNG confirm dialog.
