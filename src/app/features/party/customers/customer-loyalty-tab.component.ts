import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TranslatePipe } from '@ngx-translate/core';
import { AppGridComponent } from '../../../components/generic/grid';
import { LoyaltyProgramLookupComponent } from '../../../shared/lookups/loyalty-program-lookup.component';
import { resolveApiErrorMessage } from '../../../core/utils/api-error-message.util';
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
    LoyaltyProgramLookupComponent,
    RouterLink,
    TranslatePipe,
  ],
  templateUrl: './customer-loyalty-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerLoyaltyTabComponent implements OnInit {
  private readonly loyalty = inject(CustomerLoyaltyService);
  private readonly fb = inject(FormBuilder);

  readonly customerId = input.required<string>();

  readonly gridConfig = LOYALTY_TRANSACTION_GRID_CONFIG;
  readonly summary = signal<CustomerLoyaltySummary | null>(null);
  readonly transactions = signal<LoyaltyTransactionRow[]>([]);
  readonly loading = signal(false);
  readonly totalRecords = signal(0);
  readonly page = signal(1);
  readonly adjustDialogVisible = signal(false);
  readonly adjustError = signal('');

  readonly enrollProgramControl = new FormControl<string | null>(null);

  readonly adjustForm = this.fb.nonNullable.group({
    loyaltyProgramId: ['', Validators.required],
    pointsDelta: [0, Validators.required],
    remarks: [''],
  });

  ngOnInit(): void {
    this.reload();
  }

  onPageChange(event: { page: number; pageSize: number }): void {
    this.page.set(event.page);
    this.loadTransactions();
  }

  enroll(): void {
    const programId = this.enrollProgramControl.value?.trim();
    if (!programId) {
      return;
    }
    this.loyalty.enroll(this.customerId(), programId).subscribe({
      next: () => {
        this.enrollProgramControl.setValue(null);
        this.reload();
      },
      error: (error) => this.adjustError.set(resolveApiErrorMessage(error)),
    });
  }

  submitAdjust(): void {
    if (this.adjustForm.invalid) {
      return;
    }
    this.adjustError.set('');
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
        error: (error) => this.adjustError.set(resolveApiErrorMessage(error)),
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