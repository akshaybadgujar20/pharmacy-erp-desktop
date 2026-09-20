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
import { toEpochMs } from '../purchase-date.util';
import { PurchaseReturnItemsTabComponent } from './purchase-return-items-tab.component';
import { PurchaseReturnService } from './purchase-return.service';

@Component({
  selector: 'app-purchase-return-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    TabsModule,
    PurchaseReturnItemsTabComponent,
  ],
  templateUrl: './purchase-return-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseReturnDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly purchaseReturnService = inject(PurchaseReturnService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly returnId = signal<string | null>(null);
  readonly status = signal('DRAFT');
  readonly activeTab = signal('overview');
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly workflowRunning = signal('');
  readonly errorMessage = signal('');
  readonly version = signal('0');

  readonly isDraft = computed(() => this.status() === 'DRAFT');
  readonly canSubmit = computed(() => this.status() === 'DRAFT');
  readonly canApprove = computed(() => this.status() === 'PENDING_APPROVAL');
  readonly canReject = computed(() => this.status() === 'PENDING_APPROVAL');
  readonly canCancel = computed(() =>
    ['DRAFT', 'PENDING_APPROVAL', 'DISPATCHED_TO_SUPPLIER'].includes(this.status()),
  );

  readonly form = this.fb.nonNullable.group({
    branchId: ['', Validators.required],
    supplierId: ['', Validators.required],
    purchaseInvoiceId: [''],
    returnDate: ['', Validators.required],
    returnType: ['EXPIRED_GOODS', Validators.required],
    returnReason: [''],
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
      this.router.navigate(['/purchase/returns', id, 'items']);
      return;
    }
    this.router.navigate(['/purchase/returns', id]);
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    const value = this.form.getRawValue();

    if (this.isNew()) {
      this.purchaseReturnService
        .create({
          branchId: value.branchId,
          supplierId: value.supplierId,
          purchaseInvoiceId: value.purchaseInvoiceId || undefined,
          returnDate: toEpochMs(value.returnDate),
          returnType: value.returnType,
          returnReason: value.returnReason || undefined,
          remarks: value.remarks || undefined,
        })
        .subscribe({
          next: (purchaseReturn) => {
            this.saving.set(false);
            this.isNew.set(false);
            this.returnId.set(purchaseReturn.id);
            this.status.set(purchaseReturn.status);
            this.version.set(purchaseReturn.version);
            this.router.navigate(['/purchase/returns', purchaseReturn.id], { replaceUrl: true });
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.purchaseReturnService
      .update(this.returnId()!, {
        version: this.version(),
        supplierId: value.supplierId,
        purchaseInvoiceId: value.purchaseInvoiceId || null,
        returnDate: toEpochMs(value.returnDate),
        returnType: value.returnType,
        returnReason: value.returnReason || undefined,
        remarks: value.remarks || undefined,
      })
      .subscribe({
        next: (purchaseReturn) => {
          this.version.set(purchaseReturn.version);
          this.status.set(purchaseReturn.status);
          this.saving.set(false);
        },
        error: (error) => this.handleError(error),
      });
  }

  submit(): void {
    this.runWorkflow('submit', (id, body) => this.purchaseReturnService.submit(id, body));
  }

  approve(): void {
    this.runWorkflow('approve', (id, body) => this.purchaseReturnService.approve(id, body));
  }

  reject(): void {
    this.runWorkflow('reject', (id, body) => this.purchaseReturnService.reject(id, body));
  }

  cancel(): void {
    this.runWorkflow('cancel', (id, body) => this.purchaseReturnService.cancel(id, body));
  }

  deleteRecord(): void {
    const id = this.returnId();
    if (!id) {
      return;
    }

    this.deleting.set(true);
    this.errorMessage.set('');
    this.purchaseReturnService.delete(id, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/purchase/returns']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/purchase/returns']);
  }

  private load(id: string): void {
    this.purchaseReturnService.getById(id).subscribe({
      next: (purchaseReturn) => {
        this.version.set(purchaseReturn.version);
        this.status.set(purchaseReturn.status);
        this.form.patchValue({
          branchId: purchaseReturn.branchId,
          supplierId: purchaseReturn.supplierId,
          purchaseInvoiceId: purchaseReturn.purchaseInvoiceId ?? '',
          returnDate: purchaseReturn.returnDate,
          returnType: purchaseReturn.returnType,
          returnReason: purchaseReturn.returnReason ?? '',
          remarks: purchaseReturn.remarks ?? '',
        });
      },
      error: (error) => this.handleError(error),
    });
  }

  private runWorkflow(
    action: string,
    call: (
      id: string,
      body: { version: string },
    ) => ReturnType<PurchaseReturnService['submit']>,
  ): void {
    const id = this.returnId();
    if (!id) {
      return;
    }

    this.workflowRunning.set(action);
    this.errorMessage.set('');
    call(id, { version: this.version() }).subscribe({
      next: (purchaseReturn) => {
        this.workflowRunning.set('');
        this.status.set(purchaseReturn.status);
        this.version.set(purchaseReturn.version);
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
