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
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { TabsModule } from 'primeng/tabs';
import { ApiClientError } from '../../../core/models/api-response.types';
import {
  nullableEpochMs,
  optionalEpochMs,
  toEpochMs,
} from '../purchase-date.util';
import { GoodsReceiptItemsTabComponent } from './goods-receipt-items-tab.component';
import { GoodsReceiptService } from './goods-receipt.service';

@Component({
  selector: 'app-goods-receipt-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    CheckboxModule,
    TabsModule,
    GoodsReceiptItemsTabComponent,
  ],
  templateUrl: './goods-receipt-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoodsReceiptDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly goodsReceiptService = inject(GoodsReceiptService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly goodsReceiptId = signal<string | null>(null);
  readonly status = signal('DRAFT');
  readonly activeTab = signal('overview');
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly workflowRunning = signal('');
  readonly errorMessage = signal('');
  readonly version = signal(0);

  readonly isDraft = computed(() => this.status() === 'DRAFT');
  readonly canSubmitInspection = computed(() => this.status() === 'DRAFT');
  readonly canAccept = computed(() => this.status() === 'UNDER_INSPECTION');
  readonly canReject = computed(() => this.status() === 'UNDER_INSPECTION');
  readonly canCancel = computed(() =>
    ['DRAFT', 'UNDER_INSPECTION', 'ACCEPTED', 'PARTIALLY_ACCEPTED'].includes(
      this.status(),
    ),
  );

  readonly form = this.fb.nonNullable.group({
    branchId: ['', Validators.required],
    supplierId: ['', Validators.required],
    purchaseOrderId: [''],
    receiptDate: ['', Validators.required],
    receivedByEmployeeId: ['', Validators.required],
    supplierChallanNo: [''],
    supplierChallanDate: [''],
    supplierInvoiceNo: [''],
    supplierInvoiceDate: [''],
    vehicleNumber: [''],
    isColdChainMaintained: [false],
    remarks: [''],
  });

  ngOnInit(): void {
    const goodsReceiptId = this.route.snapshot.paramMap.get('goodsReceiptId');
    if (goodsReceiptId) {
      this.isNew.set(false);
      this.goodsReceiptId.set(goodsReceiptId);
      this.activeTab.set(
        this.route.snapshot.url.some((segment) => segment.path === 'items')
          ? 'items'
          : 'overview',
      );
      this.load(goodsReceiptId);
      return;
    }
    this.form.patchValue({
      receiptDate: new Date().toISOString(),
    });
  }

  onTabChange(tab: string | number | undefined): void {
    if (tab === undefined) {
      return;
    }
    const tabValue = String(tab);
    this.activeTab.set(tabValue);
    const id = this.goodsReceiptId();
    if (!id) {
      return;
    }
    if (tabValue === 'items') {
      this.router.navigate(['/purchase/goods-receipts', id, 'items']);
      return;
    }
    this.router.navigate(['/purchase/goods-receipts', id]);
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    const value = this.form.getRawValue();

    if (this.isNew()) {
      this.goodsReceiptService
        .create({
          branchId: value.branchId,
          supplierId: value.supplierId,
          purchaseOrderId: value.purchaseOrderId || undefined,
          receiptDate: toEpochMs(value.receiptDate),
          receivedByEmployeeId: value.receivedByEmployeeId,
          supplierChallanNo: value.supplierChallanNo || undefined,
          supplierChallanDate: optionalEpochMs(value.supplierChallanDate),
          supplierInvoiceNo: value.supplierInvoiceNo || undefined,
          supplierInvoiceDate: optionalEpochMs(value.supplierInvoiceDate),
          vehicleNumber: value.vehicleNumber || undefined,
          isColdChainMaintained: value.isColdChainMaintained,
          remarks: value.remarks || undefined,
        })
        .subscribe({
          next: (receipt) => {
            this.saving.set(false);
            this.isNew.set(false);
            this.goodsReceiptId.set(receipt.id);
            this.status.set(receipt.status);
            this.version.set(receipt.version);
            this.router.navigate(['/purchase/goods-receipts', receipt.id], { replaceUrl: true });
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.goodsReceiptService
      .update(this.goodsReceiptId()!, {
        version: this.version(),
        supplierId: value.supplierId,
        purchaseOrderId: value.purchaseOrderId || null,
        receiptDate: toEpochMs(value.receiptDate),
        receivedByEmployeeId: value.receivedByEmployeeId,
        supplierChallanNo: value.supplierChallanNo || undefined,
        supplierChallanDate: nullableEpochMs(value.supplierChallanDate),
        supplierInvoiceNo: value.supplierInvoiceNo || undefined,
        supplierInvoiceDate: nullableEpochMs(value.supplierInvoiceDate),
        vehicleNumber: value.vehicleNumber || undefined,
        isColdChainMaintained: value.isColdChainMaintained,
        remarks: value.remarks || undefined,
      })
      .subscribe({
        next: (receipt) => {
          this.version.set(receipt.version);
          this.status.set(receipt.status);
          this.saving.set(false);
        },
        error: (error) => this.handleError(error),
      });
  }

  submitInspection(): void {
    this.runWorkflow('submitInspection', (id, body) =>
      this.goodsReceiptService.submitInspection(id, body),
    );
  }

  accept(): void {
    this.runWorkflow('accept', (id, body) => this.goodsReceiptService.accept(id, body));
  }

  reject(): void {
    this.runWorkflow('reject', (id, body) => this.goodsReceiptService.reject(id, body));
  }

  cancel(): void {
    this.runWorkflow('cancel', (id, body) => this.goodsReceiptService.cancel(id, body));
  }

  deleteRecord(): void {
    const id = this.goodsReceiptId();
    if (!id) {
      return;
    }

    this.deleting.set(true);
    this.errorMessage.set('');
    this.goodsReceiptService.delete(id, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/purchase/goods-receipts']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/purchase/goods-receipts']);
  }

  private load(id: string): void {
    this.goodsReceiptService.getById(id).subscribe({
      next: (receipt) => {
        this.version.set(receipt.version);
        this.status.set(receipt.status);
        this.form.patchValue({
          branchId: receipt.branchId,
          supplierId: receipt.supplierId,
          purchaseOrderId: receipt.purchaseOrderId ?? '',
          receiptDate: receipt.receiptDate,
          receivedByEmployeeId: receipt.receivedByEmployeeId,
          supplierChallanNo: receipt.supplierChallanNo ?? '',
          supplierChallanDate: receipt.supplierChallanDate ?? '',
          supplierInvoiceNo: receipt.supplierInvoiceNo ?? '',
          supplierInvoiceDate: receipt.supplierInvoiceDate ?? '',
          vehicleNumber: receipt.vehicleNumber ?? '',
          isColdChainMaintained: receipt.isColdChainMaintained,
          remarks: receipt.remarks ?? '',
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
    ) => ReturnType<GoodsReceiptService['submitInspection']>,
  ): void {
    const id = this.goodsReceiptId();
    if (!id) {
      return;
    }

    this.workflowRunning.set(action);
    this.errorMessage.set('');
    call(id, { version: this.version() }).subscribe({
      next: (receipt) => {
        this.workflowRunning.set('');
        this.status.set(receipt.status);
        this.version.set(receipt.version);
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
