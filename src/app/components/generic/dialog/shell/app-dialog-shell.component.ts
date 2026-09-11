import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { DynamicDialogModule } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-dialog-shell',
  standalone: true,
  imports: [ConfirmDialogModule, ConfirmPopupModule, DynamicDialogModule],
  template: `
    <p-confirmdialog />
    <p-confirmpopup />
    <p-dynamicdialog />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppDialogShellComponent {}
