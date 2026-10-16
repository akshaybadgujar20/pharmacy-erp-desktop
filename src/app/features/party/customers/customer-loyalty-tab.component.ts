import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { AppGridComponent } from '../../../components/generic/grid';
import { LOYALTY_TRANSACTION_GRID_CONFIG } from './loyalty-transaction-grid.config';
import {
  CustomerLoyaltyService,
  CustomerLoyaltySummary,
  LoyaltyTransactionRow,
} from './customer-loyalty.service';

@Component({
  selector: 'app-customer-loyalty-tab',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    AppGridComponent,
  ],
  template: `
    @if (summary()) {
      <p>Balance: {{ summary()!.balancePoints }} points</p>
      @if (summary()!.membership) {
        <p>Program: {{ summary()!.membership!.programName }}</p>
      }
    }
    <div class="detail-form__field">
      <label for="programId">Program ID to enroll</label>
      <input pInputText id="programId" [value]="programId()" (input)="onProgramId($event)" />
      <button pButton type="button" label="Enroll" (click)="enroll()"></button>
      <button pButton type="button" label="Adjust points" (click)="adjustDialogVisible.set(true)"></button>
    </div>
    <app-grid
      [config]="gridConfig"
      [data]="transactions()"
      [loading]="loading()"
      [totalRecords]="totalRecords()"
      (pageChange)="onPageChange($event)"
    />
    <p-dialog header="Manual adjustment" [visible]="adjustDialogVisible()" [modal]="true" (onHide)="adjustDialogVisible.set(false)">
      <form [formGroup]="adjustForm" (ngSubmit)="submitAdjust()">
        <input pInputText formControlName="loyaltyProgramId" placeholder="Program ID" />
        <input pInputText type="number" formControlName="pointsDelta" placeholder="Points delta" />
        <input pInputText formControlName="remarks" placeholder="Remarks" />
        <button pButton type="submit" [disabled]="adjustForm.invalid">Submit</button>
      </form>
    </p-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerLoyaltyTabComponent implements OnInit {
  private readonly loyalty = inject(CustomerLoyaltyService);
  private readonly fb = inject(FormBuilder);

  readonly customerId = input.required<string>();

  readonly gridConfig = LOYALTY_TRANSACTION_GRID_CONFIG;
  readonly summary = signal<CustomerLoyaltySummary | null>(null);
  readonly transactions = signal<LoyaltyTransactionRow[]>([]);
  readonly programId = signal('');
  readonly loading = signal(false);
  readonly totalRecords = signal(0);
  readonly page = signal(1);
  readonly adjustDialogVisible = signal(false);

  readonly adjustForm = this.fb.nonNullable.group({
    loyaltyProgramId: ['', Validators.required],
    pointsDelta: [0, Validators.required],
    remarks: [''],
  });

  ngOnInit(): void {
    this.reload();
  }

  onProgramId(event: Event): void {
    this.programId.set((event.target as HTMLInputElement).value);
  }

  onPageChange(event: { page: number; pageSize: number }): void {
    this.page.set(event.page);
    this.loadTransactions();
  }

  enroll(): void {
    const programId = this.programId().trim();
    if (!programId) {
      return;
    }
    this.loyalty.enroll(this.customerId(), programId).subscribe({
      next: () => this.reload(),
    });
  }

  submitAdjust(): void {
    if (this.adjustForm.invalid) {
      return;
    }
    const value = this.adjustForm.getRawValue();
    this.loyalty
      .adjust(this.customerId(), {
        loyaltyProgramId: value.loyaltyProgramId,
        pointsDelta: value.pointsDelta,
        remarks: value.remarks || undefined,
      })
      .subscribe({
        next: () => {
          this.adjustDialogVisible.set(false);
          this.reload();
        },
      });
  }

  private reload(): void {
    this.loyalty.summary(this.customerId()).subscribe({
      next: (data) => {
        this.summary.set(data);
        const programId = data.membership?.loyaltyProgramId;
        if (programId) {
          this.adjustForm.patchValue({ loyaltyProgramId: programId });
        }
      },
    });
    this.loadTransactions();
  }

  private loadTransactions(): void {
    this.loading.set(true);
    this.loyalty
      .transactions(this.customerId(), String(this.page()), '10')
      .subscribe({
        next: ({ data, pagination }) => {
          this.transactions.set(data);
          this.totalRecords.set(pagination.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
