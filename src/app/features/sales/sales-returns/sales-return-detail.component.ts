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
import { SalesReturnItemsTabComponent } from './sales-return-items-tab.component';
import { SalesReturnService } from './sales-return.service';

@Component({
  selector: 'app-sales-return-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    TabsModule,
    SalesReturnItemsTabComponent,
  ],
  templateUrl: './sales-return-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesReturnDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly salesReturnService = inject(SalesReturnService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly returnId = signal<string | null>(null);
  readonly salesReturnNumber = signal('');
  readonly status = signal('DRAFT');
  readonly activeTab = signal('overview');
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly approving = signal(false);
  readonly cancelling = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal(0);

  readonly isDraft = computed(() => this.status() === 'DRAFT');
  readonly isCompleted = computed(() => this.status() === 'COMPLETED');

  readonly form = this.fb.nonNullable.group({
    branchId: ['', Validators.required],
    salesInvoiceId: ['', Validators.required],
    customerId: [''],
    returnDate: ['', Validators.required],
    returnReason: ['OTHER', Validators.required],
    refundMode: [''],
    creditNoteNumber: [''],
    remarks: [''],
  });

  ngOnInit(): void {
    const returnId = this.route.snapshot.paramMap.get('returnId');
    if (returnId) {
      this.isNew.set(false);
      this.returnId.set(returnId);
      this.activeTab.set(
        this.route.snapshot.url.some((segment) => segment.path === 'items')
          ? 'items'
          : 'overview',
      );
      this.load(returnId);
      return;
    }
    this.form.patchValue({
      returnDate: new Date().toISOString(),
    });
  }

  onTabChange(tab: string | number | undefined): void {
    if (tab === undefined) {
      return;
    }
    const tabValue = String(tab);
    this.activeTab.set(tabValue);
    const id = this.returnId();
    if (!id) {
      return;
    }
    if (tabValue === 'items') {
      this.router.navigate(['/sales/returns', id, 'items']);
      return;
    }
    this.router.navigate(['/sales/returns', id]);
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    const value = this.form.getRawValue();

    if (this.isNew()) {
      this.salesReturnService
        .create({
          branchId: value.branchId,
          salesInvoiceId: value.salesInvoiceId,
          customerId: value.customerId || undefined,
          returnDate: toEpochMs(value.returnDate),
          returnReason: value.returnReason,
          remarks: value.remarks || undefined,
        })
        .subscribe({
          next: (salesReturn) => {
            this.saving.set(false);
            this.isNew.set(false);
            this.returnId.set(salesReturn.id);
            this.status.set(salesReturn.status);
            this.version.set(salesReturn.version);
            this.router.navigate(['/sales/returns', salesReturn.id], { replaceUrl: true });
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.salesReturnService
      .update(this.returnId()!, {
        version: this.version(),
        customerId: value.customerId || undefined,
        returnDate: toEpochMs(value.returnDate),
        returnReason: value.returnReason,
        refundMode: value.refundMode || undefined,
        creditNoteNumber: value.creditNoteNumber || undefined,
        remarks: value.remarks || undefined,
      })
      .subscribe({
        next: (salesReturn) => {
          this.version.set(salesReturn.version);
          this.status.set(salesReturn.status);
          this.saving.set(false);
        },
        error: (error) => this.handleError(error),
      });
  }

  approve(): void {
    const id = this.returnId();
    if (!id) {
      return;
    }

    this.approving.set(true);
    this.errorMessage.set('');
    this.salesReturnService.approve(id, { version: this.version() }).subscribe({
      next: (salesReturn) => {
        this.approving.set(false);
        this.status.set(salesReturn.status);
        this.salesReturnNumber.set(salesReturn.salesReturnNumber);
        this.version.set(salesReturn.version);
      },
      error: (error) => {
        this.approving.set(false);
        this.handleError(error);
      },
    });
  }

  cancel(): void {
    const id = this.returnId();
    if (!id) {
      return;
    }

    this.cancelling.set(true);
    this.errorMessage.set('');
    this.salesReturnService.cancel(id, { version: this.version() }).subscribe({
      next: (salesReturn) => {
        this.cancelling.set(false);
        this.status.set(salesReturn.status);
        this.version.set(salesReturn.version);
      },
      error: (error) => {
        this.cancelling.set(false);
        this.handleError(error);
      },
    });
  }

  deleteRecord(): void {
    const id = this.returnId();
    if (!id) {
      return;
    }

    this.deleting.set(true);
    this.errorMessage.set('');
    this.salesReturnService.delete(id, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/sales/returns']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/sales/returns']);
  }

  private load(id: string): void {
    this.salesReturnService.getById(id).subscribe({
      next: (salesReturn) => {
        this.version.set(salesReturn.version);
        this.status.set(salesReturn.status);
        this.salesReturnNumber.set(salesReturn.salesReturnNumber);
        this.form.patchValue({
          branchId: salesReturn.branchId,
          salesInvoiceId: salesReturn.salesInvoiceId,
          customerId: salesReturn.customerId ?? '',
          returnDate: fromEpochMs(salesReturn.returnDate),
          returnReason: salesReturn.returnReason,
          refundMode: salesReturn.refundMode ?? '',
          creditNoteNumber: salesReturn.creditNoteNumber ?? '',
          remarks: salesReturn.remarks ?? '',
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
