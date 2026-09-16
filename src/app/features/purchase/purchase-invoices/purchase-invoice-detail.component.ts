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
import {
  nullableEpochMs,
  optionalEpochMs,
  toEpochMs,
} from '../purchase-date.util';
import { PurchaseInvoiceItemsTabComponent } from './purchase-invoice-items-tab.component';
import { PurchaseInvoiceService } from './purchase-invoice.service';

@Component({
  selector: 'app-purchase-invoice-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    TabsModule,
    PurchaseInvoiceItemsTabComponent,
  ],
  templateUrl: './purchase-invoice-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseInvoiceDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly purchaseInvoiceService = inject(PurchaseInvoiceService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly invoiceId = signal<string | null>(null);
  readonly status = signal('DRAFT');
  readonly activeTab = signal('overview');
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly workflowRunning = signal('');
  readonly errorMessage = signal('');
  readonly version = signal(0);

  readonly isDraft = computed(() => this.status() === 'DRAFT');
  readonly canPost = computed(() => this.status() === 'DRAFT');
  readonly canCancel = computed(() => this.status() === 'POSTED');

  readonly form = this.fb.nonNullable.group({
    branchId: ['', Validators.required],
    supplierId: ['', Validators.required],
    supplierInvoiceNumber: ['', Validators.required],
    goodsReceiptId: [''],
    invoiceDate: ['', Validators.required],
    dueDate: [''],
    remarks: [''],
  });

  ngOnInit(): void {
    const invoiceId = this.route.snapshot.paramMap.get('invoiceId');
    if (invoiceId) {
      this.isNew.set(false);
      this.invoiceId.set(invoiceId);
      this.activeTab.set(
        this.route.snapshot.url.some((segment) => segment.path === 'items')
          ? 'items'
          : 'overview',
      );
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
      this.router.navigate(['/purchase/invoices', id, 'items']);
      return;
    }
    this.router.navigate(['/purchase/invoices', id]);
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    const value = this.form.getRawValue();

    if (this.isNew()) {
      this.purchaseInvoiceService
        .create({
          branchId: value.branchId,
          supplierId: value.supplierId,
          supplierInvoiceNumber: value.supplierInvoiceNumber,
          goodsReceiptId: value.goodsReceiptId || undefined,
          invoiceDate: toEpochMs(value.invoiceDate),
          dueDate: optionalEpochMs(value.dueDate),
          remarks: value.remarks || undefined,
        })
        .subscribe({
          next: (invoice) => {
            this.saving.set(false);
            this.isNew.set(false);
            this.invoiceId.set(invoice.id);
            this.status.set(invoice.status);
            this.version.set(invoice.version);
            this.router.navigate(['/purchase/invoices', invoice.id], { replaceUrl: true });
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.purchaseInvoiceService
      .update(this.invoiceId()!, {
        version: this.version(),
        supplierId: value.supplierId,
        supplierInvoiceNumber: value.supplierInvoiceNumber,
        goodsReceiptId: value.goodsReceiptId || null,
        invoiceDate: toEpochMs(value.invoiceDate),
        dueDate: nullableEpochMs(value.dueDate),
        remarks: value.remarks || undefined,
      })
      .subscribe({
        next: (invoice) => {
          this.version.set(invoice.version);
          this.status.set(invoice.status);
          this.saving.set(false);
        },
        error: (error) => this.handleError(error),
      });
  }

  post(): void {
    this.runWorkflow('post', (id, body) => this.purchaseInvoiceService.post(id, body));
  }

  cancel(): void {
    this.runWorkflow('cancel', (id, body) => this.purchaseInvoiceService.cancel(id, body));
  }

  deleteRecord(): void {
    const id = this.invoiceId();
    if (!id) {
      return;
    }

    this.deleting.set(true);
    this.errorMessage.set('');
    this.purchaseInvoiceService.delete(id, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/purchase/invoices']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/purchase/invoices']);
  }

  private load(id: string): void {
    this.purchaseInvoiceService.getById(id).subscribe({
      next: (invoice) => {
        this.version.set(invoice.version);
        this.status.set(invoice.status);
        this.form.patchValue({
          branchId: invoice.branchId,
          supplierId: invoice.supplierId,
          supplierInvoiceNumber: invoice.supplierInvoiceNumber,
          goodsReceiptId: invoice.goodsReceiptId ?? '',
          invoiceDate: invoice.invoiceDate,
          dueDate: invoice.dueDate ?? '',
          remarks: invoice.remarks ?? '',
        });
      },
      error: (error) => this.handleError(error),
    });
  }

  private runWorkflow(
    action: string,
    call: (
      id: string,
      body: { version: number },
    ) => ReturnType<PurchaseInvoiceService['post']>,
  ): void {
    const id = this.invoiceId();
    if (!id) {
      return;
    }

    this.workflowRunning.set(action);
    this.errorMessage.set('');
    call(id, { version: this.version() }).subscribe({
      next: (invoice) => {
        this.workflowRunning.set('');
        this.status.set(invoice.status);
        this.version.set(invoice.version);
      },
      error: (error) => {
        this.workflowRunning.set('');
        this.handleError(error);
      },
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
