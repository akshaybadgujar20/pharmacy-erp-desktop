import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';

const NOTES_KEY = 'cash-drawer-reconciliation-notes';

@Component({
  selector: 'app-cash-drawer',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, InputNumberModule, InputTextModule],
  template: `
    <section class="page-layout">
      <h2>Cash drawer reconciliation (v1)</h2>
      <p>System receipts are entered manually until a branch day-total API is available.</p>
      <form [formGroup]="form" (ngSubmit)="reconcile()">
        <label>Opening float <input pInputNumber formControlName="openingFloat" /></label>
        <label>Counted cash <input pInputNumber formControlName="countedCash" /></label>
        <label>System receipts <input pInputNumber formControlName="systemReceipts" /></label>
        <label>Notes <input pInputText formControlName="notes" /></label>
        <button pButton type="submit" label="Calculate variance"></button>
      </form>
      @if (variance() !== null) {
        <p>Variance: {{ variance() }}</p>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CashDrawerComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly variance = signal<number | null>(null);
  readonly form = this.fb.nonNullable.group({
    openingFloat: [0],
    countedCash: [0],
    systemReceipts: [0],
    notes: [''],
  });

  ngOnInit(): void {
    const saved = localStorage.getItem(NOTES_KEY);
    if (saved) {
      this.form.patchValue({ notes: saved });
    }
  }

  reconcile(): void {
    const value = this.form.getRawValue();
    localStorage.setItem(NOTES_KEY, value.notes);
    this.variance.set(
      value.countedCash - value.openingFloat - value.systemReceipts,
    );
  }
}
