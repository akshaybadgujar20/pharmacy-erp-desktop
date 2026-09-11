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
      <p-button type="button" severity="secondary" label="Cancel" (onClick)="close()" />
      <p-button type="button" label="Select" (onClick)="close('selected')" />
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
