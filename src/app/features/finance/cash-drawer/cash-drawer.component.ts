import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';

@Component({
  selector: 'app-cash-drawer',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, InputNumberModule],
  template: `
    <section class="page-layout">
      <h2>Cash drawer reconciliation (v1)</h2>
      <form [formGroup]="form" (ngSubmit)="reconcile()">
        <label>Opening float <input pInputNumber formControlName="openingFloat" /></label>
        <label>Counted cash <input pInputNumber formControlName="countedCash" /></label>
        <label>System receipts <input pInputNumber formControlName="systemReceipts" /></label>
        <button pButton type="submit" label="Calculate variance"></button>
      </form>
      @if (variance() !== null) {
        <p>Variance: {{ variance() }}</p>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CashDrawerComponent {
  private readonly fb = inject(FormBuilder);
  readonly variance = signal<number | null>(null);
  readonly form = this.fb.nonNullable.group({
    openingFloat: [0],
    countedCash: [0],
    systemReceipts: [0],
  });

  reconcile(): void {
    const value = this.form.getRawValue();
    this.variance.set(
      value.countedCash - value.openingFloat - value.systemReceipts,
    );
  }
}
