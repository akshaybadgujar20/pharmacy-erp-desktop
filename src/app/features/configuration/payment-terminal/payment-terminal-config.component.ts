import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
@Component({
  selector: 'app-payment-terminal-config',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule],
  template: `
    <section class="page-layout">
      <h2>Payment terminal</h2>
      <p>Live gateway integrations are disabled in v1. Configure device IDs for future use only.</p>
      <form [formGroup]="form" (ngSubmit)="save()">
        <input pInputText formControlName="deviceId" placeholder="Device ID" />
        <input pInputText formControlName="provider" placeholder="Provider" />
        <button pButton type="submit" label="Save to settings"></button>
      </form>
      @if (message()) {
        <p>{{ message() }}</p>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentTerminalConfigComponent {
  private readonly fb = inject(FormBuilder);
  readonly message = signal('');

  readonly form = this.fb.nonNullable.group({
    deviceId: ['', Validators.required],
    provider: ['STUB', Validators.required],
  });

  save(): void {
    const value = this.form.getRawValue();
    const payload = JSON.stringify(value);
    this.message.set(`Saved locally: ${payload}`);
  }
}
