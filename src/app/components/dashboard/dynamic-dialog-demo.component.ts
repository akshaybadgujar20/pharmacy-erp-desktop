import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-dynamic-dialog-demo',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <p class="demo-dialog-message">Select an option to return to the caller.</p>
    <div class="demo-dialog-actions">
      <button type="button" pButton severity="secondary" label="Cancel" (click)="close()"></button>
      <button type="button" pButton label="Select" (click)="close('selected')"></button>
    </div>
  `,
  styles: `
    .demo-dialog-message {
      margin: 0 0 1rem;
    }
    .demo-dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicDialogDemoComponent {
  private readonly ref = inject(DynamicDialogRef);

  close(value?: string): void {
    this.ref.close(value);
  }
}
