import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { AppGridComponent } from '../../../components/generic/grid';
import {
  GridActionEvent,
  GridFilterChange,
  GridPageChange,
} from '../../../components/generic/grid/types/grid-events.types';
import { toListParams } from '../../../shared/utils/list-query.util';
import { fromEpochMs, toEpochMs } from '../sales-date.util';
import { SALES_INVOICE_PAYMENT_GRID_CONFIG } from './sales-invoice-payment-grid.config';
import { SalesInvoicePayment } from './sales-invoice-payment.models';
import { SalesInvoicePaymentService } from './sales-invoice-payment.service';

@Component({
  selector: 'app-sales-invoice-payments-tab',
  standalone: true,
  imports: [
    AppGridComponent,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
  ],
  templateUrl: './sales-invoice-payments-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesInvoicePaymentsTabComponent {
  private readonly fb = inject(FormBuilder);
  private readonly salesInvoicePaymentService = inject(SalesInvoicePaymentService);

  readonly invoiceId = input.required<string>();
  readonly editable = input(true);

  readonly gridConfig = SALES_INVOICE_PAYMENT_GRID_CONFIG;
  readonly rows = signal<SalesInvoicePayment[]>([]);
  readonly loading = signal(false);
  readonly totalRecords = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly search = signal('');
  readonly dialogVisible = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly editingVersion = signal(0);
  readonly editingStatus = signal('PENDING');
  readonly saving = signal(false);
  readonly workflowInProgress = signal(false);

  readonly form = this.fb.nonNullable.group({
    paymentDate: ['', Validators.required],
    paymentMethod: ['CASH', Validators.required],
    paymentAmount: [0, Validators.required],
    tenderedAmount: [null as number | null],
    transactionReference: [''],
    remarks: [''],
  });

  constructor() {
    effect(() => {
      const id = this.invoiceId();
      if (id) {
        this.load();
      }
    });
  }

  onPageChange(event: GridPageChange): void {
    this.page.set(event.page);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  onFilterChange(event: GridFilterChange): void {
    this.search.set(event.globalSearch ?? '');
    this.page.set(1);
    this.load();
  }

  onGridAction(event: GridActionEvent<SalesInvoicePayment>): void {
    if (!event.row || !this.editable()) {
      return;
    }
    if (event.action === 'edit') {
      this.openEdit(event.row);
    }
    if (event.action === 'delete') {
      this.salesInvoicePaymentService
        .delete(this.invoiceId(), event.row.id, event.row.version)
        .subscribe({ next: () => this.load() });
    }
  }

  openCreate(): void {
    this.editingId.set(null);
    this.editingVersion.set(0);
    this.editingStatus.set('PENDING');
    this.form.reset({
      paymentDate: new Date().toISOString(),
      paymentMethod: 'CASH',
      paymentAmount: 0,
      tenderedAmount: null,
      transactionReference: '',
      remarks: '',
    });
    this.dialogVisible.set(true);
  }

  openEdit(payment: SalesInvoicePayment): void {
    this.editingId.set(payment.id);
    this.editingVersion.set(payment.version);
    this.editingStatus.set(payment.status);
    this.form.patchValue({
      paymentDate: fromEpochMs(payment.paymentDate),
      paymentMethod: payment.paymentMethod,
      paymentAmount: payment.paymentAmount ?? 0,
      tenderedAmount: payment.tenderedAmount,
      transactionReference: payment.transactionReference ?? '',
      remarks: payment.remarks ?? '',
    });
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    const value = this.form.getRawValue();
    const invoiceId = this.invoiceId();

    if (this.editingId()) {
      this.salesInvoicePaymentService
        .update(invoiceId, this.editingId()!, {
          version: this.editingVersion(),
          paymentDate: toEpochMs(value.paymentDate),
          paymentMethod: value.paymentMethod,
          paymentAmount: value.paymentAmount,
          tenderedAmount: value.tenderedAmount ?? undefined,
          transactionReference: value.transactionReference || undefined,
          remarks: value.remarks || undefined,
        })
        .subscribe({
          next: () => {
            this.saving.set(false);
            this.closeDialog();
            this.load();
          },
          error: () => this.saving.set(false),
        });
      return;
    }

    this.salesInvoicePaymentService
      .create(invoiceId, {
        paymentDate: toEpochMs(value.paymentDate),
        paymentMethod: value.paymentMethod,
        paymentAmount: value.paymentAmount,
        tenderedAmount: value.tenderedAmount ?? undefined,
        transactionReference: value.transactionReference || undefined,
        remarks: value.remarks || undefined,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.closeDialog();
          this.load();
        },
        error: () => this.saving.set(false),
      });
  }

  completePayment(): void {
    const paymentId = this.editingId();
    if (!paymentId) {
      return;
    }

    this.workflowInProgress.set(true);
    this.salesInvoicePaymentService
      .complete(this.invoiceId(), paymentId, { version: this.editingVersion() })
      .subscribe({
        next: () => {
          this.workflowInProgress.set(false);
          this.closeDialog();
          this.load();
        },
        error: () => this.workflowInProgress.set(false),
      });
  }

  cancelPayment(): void {
    const paymentId = this.editingId();
    if (!paymentId) {
      return;
    }

    this.workflowInProgress.set(true);
    this.salesInvoicePaymentService
      .cancel(this.invoiceId(), paymentId, { version: this.editingVersion() })
      .subscribe({
        next: () => {
          this.workflowInProgress.set(false);
          this.closeDialog();
          this.load();
        },
        error: () => this.workflowInProgress.set(false),
      });
  }

  private load(): void {
    this.loading.set(true);
    this.salesInvoicePaymentService
      .list(this.invoiceId(), toListParams(this.page(), this.pageSize(), this.search()))
      .subscribe({
        next: (result) => {
          this.rows.set(result.data);
          this.totalRecords.set(result.pagination.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
