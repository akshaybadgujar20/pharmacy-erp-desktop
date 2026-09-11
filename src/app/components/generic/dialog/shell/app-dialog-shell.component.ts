import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmPopupModule } from 'primeng/confirmpopup';

@Component({
  selector: 'app-dialog-shell',
  standalone: true,
  imports: [ConfirmDialogModule, ConfirmPopupModule],
  template: `
    <p-confirmdialog />
    <p-confirmpopup />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppDialogShellComponent {}
