import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TabsModule } from 'primeng/tabs';
import { ApiClientError } from '../../../core/models/api-response.types';
import { fromEpochMs, toEpochMs } from '../sales-date.util';
import { SalesInvoiceItemsTabComponent } from './sales-invoice-items-tab.component';
import { SalesInvoicePaymentsTabComponent } from './sales-invoice-payments-tab.component';
import { SalesInvoiceService } from './sales-invoice.service';

@Component({
  selector: 'app-sales-invoice-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    TabsModule,
    SalesInvoiceItemsTabComponent,
    SalesInvoicePaymentsTabComponent,
  ],
  templateUrl: './sales-invoice-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesInvoiceDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly salesInvoiceService = inject(SalesInvoiceService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly invoiceId = signal<string | null>(null);
  readonly invoiceNumber = signal('');
  readonly status = signal('DRAFT');
  readonly paymentStatus = signal('UNPAID');
  readonly activeTab = signal('overview');
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly posting = signal(false);
  readonly cancelling = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal('0');

  readonly isDraft = computed(() => this.status() === 'DRAFT');
  readonly canManagePayments = computed(() =>
    ['POSTED', 'PARTIALLY_RETURNED'].includes(this.status()),
  );

  readonly form = this.fb.nonNullable.group({
    branchId: ['', Validators.required],
    customerId: [''],
    prescriptionId: [''],
    invoiceDate: ['', Validators.required],
    patientName: [''],
    doctorName: [''],
    salesType: ['RETAIL_OTC', Validators.required],
    paymentMode: [''],
    remarks: [''],
  });

  ngOnInit(): void {
    const invoiceId = this.route.snapshot.paramMap.get('invoiceId');
    if (invoiceId) {
      this.isNew.set(false);
      this.invoiceId.set(invoiceId);
      const segments = this.route.snapshot.url.map((segment) => segment.path);
      if (segments.includes('items')) {
        this.activeTab.set('items');
      } else if (segments.includes('payments')) {
        this.activeTab.set('payments');
      } else {
        this.activeTab.set('overview');
      }
      this.load(invoiceId);
      return;
    }
    this.form.patchValue({
      invoiceDate: new Date().toISOString(),
    });
  }

  onTabChange(tab: string | number | undefined): void {
    if (tab === undefined) {
      return;
    }
    const tabValue = String(tab);
    this.activeTab.set(tabValue);
    const id = this.invoiceId();
    if (!id) {
      return;
    }
    if (tabValue === 'items') {
      this.router.navigate(['/sales/invoices', id, 'items']);
      return;
    }
    if (tabValue === 'payments') {
      this.router.navigate(['/sales/invoices', id, 'payments']);
      return;
    }
    this.router.navigate(['/sales/invoices', id]);
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    const value = this.form.getRawValue();

    if (this.isNew()) {
      this.salesInvoiceService
        .create({
          branchId: value.branchId,
          customerId: value.customerId || undefined,
          prescriptionId: value.prescriptionId || undefined,
          invoiceDate: toEpochMs(value.invoiceDate),
          patientName: value.patientName || undefined,
          doctorName: value.doctorName || undefined,
          salesType: value.salesType,
          remarks: value.remarks || undefined,
        })
        .subscribe({
          next: (invoice) => {
            this.saving.set(false);
            this.isNew.set(false);
            this.invoiceId.set(invoice.id);
            this.status.set(invoice.status);
            this.paymentStatus.set(invoice.paymentStatus);
            this.version.set(invoice.version);
            this.router.navigate(['/sales/invoices', invoice.id], { replaceUrl: true });
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.salesInvoiceService
      .update(this.invoiceId()!, {
        version: this.version(),
        customerId: value.customerId || undefined,
        prescriptionId: value.prescriptionId || undefined,
        invoiceDate: toEpochMs(value.invoiceDate),
        patientName: value.patientName || undefined,
        doctorName: value.doctorName || undefined,
        salesType: value.salesType,
        paymentMode: value.paymentMode || undefined,
        remarks: value.remarks || undefined,
      })
      .subscribe({
        next: (invoice) => {
          this.version.set(invoice.version);
          this.status.set(invoice.status);
          this.paymentStatus.set(invoice.paymentStatus);
          this.saving.set(false);
        },
        error: (error) => this.handleError(error),
      });
  }

  post(): void {
    const id = this.invoiceId();
    if (!id) {
      return;
    }

    this.posting.set(true);
    this.errorMessage.set('');
    this.salesInvoiceService.post(id, { version: this.version() }).subscribe({
      next: (invoice) => {
        this.posting.set(false);
        this.status.set(invoice.status);
        this.paymentStatus.set(invoice.paymentStatus);
        this.invoiceNumber.set(invoice.invoiceNumber);
        this.version.set(invoice.version);
      },
      error: (error) => {
        this.posting.set(false);
        this.handleError(error);
      },
    });
  }

  cancel(): void {
    const id = this.invoiceId();
    if (!id) {
      return;
    }

    this.cancelling.set(true);
    this.errorMessage.set('');
    this.salesInvoiceService.cancel(id, { version: this.version() }).subscribe({
      next: (invoice) => {
        this.cancelling.set(false);
        this.status.set(invoice.status);
        this.paymentStatus.set(invoice.paymentStatus);
        this.version.set(invoice.version);
      },
      error: (error) => {
        this.cancelling.set(false);
        this.handleError(error);
      },
    });
  }

  deleteRecord(): void {
    const id = this.invoiceId();
    if (!id) {
      return;
    }

    this.deleting.set(true);
    this.errorMessage.set('');
    this.salesInvoiceService.delete(id, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/sales/invoices']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/sales/invoices']);
  }

  private load(id: string): void {
    this.salesInvoiceService.getById(id).subscribe({
      next: (invoice) => {
        this.version.set(invoice.version);
        this.status.set(invoice.status);
        this.paymentStatus.set(invoice.paymentStatus);
        this.invoiceNumber.set(invoice.invoiceNumber);
        this.form.patchValue({
          branchId: invoice.branchId,
          customerId: invoice.customerId ?? '',
          prescriptionId: invoice.prescriptionId ?? '',
          invoiceDate: fromEpochMs(invoice.invoiceDate),
          patientName: invoice.patientName ?? '',
          doctorName: invoice.doctorName ?? '',
          salesType: invoice.salesType,
          paymentMode: invoice.paymentMode ?? '',
          remarks: invoice.remarks ?? '',
        });
      },
      error: (error) => this.handleError(error),
    });
  }

  private handleError(error: unknown): void {
    this.saving.set(false);
    this.errorMessage.set(
      error instanceof ApiClientError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Request failed',
    );
  }
}
