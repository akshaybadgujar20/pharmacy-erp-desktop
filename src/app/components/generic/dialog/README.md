# AppDialog

Configuration-driven dialog layer for pharmacy ERP screens. Wraps PrimeNG Dialog, Drawer, ConfirmDialog, ConfirmPopup, and DynamicDialog.

## Location

```text
src/app/components/generic/dialog/
```

Page-specific configs live next to feature components (e.g. `customer-form-dialog.config.ts`).

## App shell setup

`AppDialogShellComponent` must be mounted once at app root (alongside toast host). Global providers in `app.config.ts`:

- `ConfirmationService`
- `DialogService`

```html
<app-dialog-shell />
```

Dynamic dialogs do not need a static `<p-dynamicdialog />` in the shell. `DialogService` creates them imperatively when you call `AppDialogService.openDynamic()`.

## Imperative API

Inject `AppDialogService` for confirm flows and dynamic dialogs:

```ts
this.appDialogService.confirm({ message: 'Save changes?', preset: 'info' }).subscribe((accepted) => {
  if (accepted) { /* ... */ }
});

this.appDialogService.confirmPopup({ message: 'Proceed?' }, event.currentTarget).subscribe(/* ... */);

this.appDialogService.confirmDelete('Delete this customer?').subscribe(/* ... */);

const ref = this.appDialogService.openDynamic(MyFormComponent, { header: 'Edit', width: '40rem' });
ref.onClose.subscribe((result) => { /* ... */ });
```

Close dynamic dialog refs in `ngOnDestroy` if still open.

## Declarative API

```html
<app-dialog [config]="dialogConfig" [(visible)]="dialogVisible" (footerAction)="onDialogFooter($event)">
  <p>Body content</p>
</app-dialog>

<app-drawer [config]="drawerConfig" [(visible)]="drawerVisible" (footerAction)="onDrawerFooter($event)">
  <p>Filter panel</p>
</app-drawer>
```

Custom header/footer templates:

```html
<app-dialog [config]="dialogConfig" [(visible)]="visible">
  <ng-template #header>Custom header</ng-template>
  <p>Body</p>
  <ng-template #footer>
    <button pButton label="Close" (click)="visible = false"></button>
  </ng-template>
</app-dialog>
```

## Confirm presets

| Preset | Use |
|--------|-----|
| `info` | Save, continue, generic confirmation |
| `danger` | Delete, destructive actions |
| `custom` | Full override, no preset merge |

## Footer actions

Config footer buttons emit `{ buttonId }` — parent handles business logic:

```ts
dialogConfig: DialogConfig = {
  header: 'Edit Customer',
  footer: {
    buttons: [
      { id: 'cancel', label: 'Cancel', severity: 'secondary', variant: 'outlined' },
      { id: 'save', label: 'Save' },
    ],
  },
};

onDialogFooter(event: DialogFooterActionEvent): void {
  if (event.buttonId === 'save') { /* save */ }
  if (event.buttonId === 'cancel') { this.dialogVisible = false; }
}
```

## Integration with AppToolbar / AppGrid

Toolbar `confirmation?: boolean | ConfirmDialogConfig` and grid row action `confirmation: true` use `AppDialogService` via `resolveConfirmConfig()`. No per-component `<p-confirmDialog />` needed.
