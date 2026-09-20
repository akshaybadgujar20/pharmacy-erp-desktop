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
import { PurchaseOrderItemsTabComponent } from './purchase-order-items-tab.component';
import { PurchaseOrderService } from './purchase-order.service';

@Component({
  selector: 'app-purchase-order-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    TabsModule,
    PurchaseOrderItemsTabComponent,
  ],
  templateUrl: './purchase-order-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseOrderDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly purchaseOrderService = inject(PurchaseOrderService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly orderId = signal<string | null>(null);
  readonly status = signal('DRAFT');
  readonly activeTab = signal('overview');
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly workflowRunning = signal('');
  readonly errorMessage = signal('');
  readonly version = signal('0');

  readonly isEditable = computed(() =>
    ['DRAFT', 'PENDING_APPROVAL'].includes(this.status()),
  );
  readonly canDelete = computed(() => this.status() === 'DRAFT');
  readonly canSubmit = computed(() => this.status() === 'DRAFT');
  readonly canApprove = computed(() => this.status() === 'PENDING_APPROVAL');
  readonly canReject = computed(() => this.status() === 'PENDING_APPROVAL');
  readonly canSend = computed(() => this.status() === 'APPROVED');
  readonly canForceClose = computed(() =>
    ['APPROVED', 'SENT_TO_SUPPLIER', 'PARTIALLY_RECEIVED'].includes(this.status()),
  );
  readonly canCancel = computed(() =>
    ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT_TO_SUPPLIER'].includes(
      this.status(),
    ),
  );

  readonly form = this.fb.nonNullable.group({
    branchId: ['', Validators.required],
    supplierId: ['', Validators.required],
    orderDate: ['', Validators.required],
    expectedDeliveryDate: [''],
    remarks: [''],
  });

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('orderId');
    if (orderId) {
      this.isNew.set(false);
      this.orderId.set(orderId);
      this.activeTab.set(
        this.route.snapshot.url.some((segment) => segment.path === 'items')
          ? 'items'
          : 'overview',
      );
      this.load(orderId);
      return;
    }
    this.form.patchValue({
      orderDate: new Date().toISOString(),
    });
  }

  onTabChange(tab: string | number | undefined): void {
    if (tab === undefined) {
      return;
    }
    const tabValue = String(tab);
    this.activeTab.set(tabValue);
    const id = this.orderId();
    if (!id) {
      return;
    }
    if (tabValue === 'items') {
      this.router.navigate(['/purchase/orders', id, 'items']);
      return;
    }
    this.router.navigate(['/purchase/orders', id]);
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    const value = this.form.getRawValue();

    if (this.isNew()) {
      this.purchaseOrderService
        .create({
          branchId: value.branchId,
          supplierId: value.supplierId,
          orderDate: toEpochMs(value.orderDate),
          expectedDeliveryDate: optionalEpochMs(value.expectedDeliveryDate),
          remarks: value.remarks || undefined,
        })
        .subscribe({
          next: (order) => {
            this.saving.set(false);
            this.isNew.set(false);
            this.orderId.set(order.id);
            this.status.set(order.status);
            this.version.set(order.version);
            this.router.navigate(['/purchase/orders', order.id], { replaceUrl: true });
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.purchaseOrderService
      .update(this.orderId()!, {
        version: this.version(),
        supplierId: value.supplierId,
        orderDate: toEpochMs(value.orderDate),
        expectedDeliveryDate: nullableEpochMs(value.expectedDeliveryDate),
        remarks: value.remarks || undefined,
      })
      .subscribe({
        next: (order) => {
          this.version.set(order.version);
          this.status.set(order.status);
          this.saving.set(false);
        },
        error: (error) => this.handleError(error),
      });
  }

  submit(): void {
    this.runWorkflow('submit', (id, body) => this.purchaseOrderService.submit(id, body));
  }

  approve(): void {
    this.runWorkflow('approve', (id, body) => this.purchaseOrderService.approve(id, body));
  }

  reject(): void {
    this.runWorkflow('reject', (id, body) => this.purchaseOrderService.reject(id, body));
  }

  send(): void {
    this.runWorkflow('send', (id, body) => this.purchaseOrderService.send(id, body));
  }

  forceClose(): void {
    this.runWorkflow('forceClose', (id, body) =>
      this.purchaseOrderService.forceClose(id, body),
    );
  }

  cancel(): void {
    this.runWorkflow('cancel', (id, body) => this.purchaseOrderService.cancel(id, body));
  }

  deleteRecord(): void {
    const id = this.orderId();
    if (!id) {
      return;
    }

    this.deleting.set(true);
    this.errorMessage.set('');
    this.purchaseOrderService.delete(id, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/purchase/orders']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/purchase/orders']);
  }

  private load(id: string): void {
    this.purchaseOrderService.getById(id).subscribe({
      next: (order) => {
        this.version.set(order.version);
        this.status.set(order.status);
        this.form.patchValue({
          branchId: order.branchId,
          supplierId: order.supplierId,
          orderDate: order.orderDate,
          expectedDeliveryDate: order.expectedDeliveryDate ?? '',
          remarks: order.remarks ?? '',
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
    ) => ReturnType<PurchaseOrderService['submit']>,
  ): void {
    const id = this.orderId();
    if (!id) {
      return;
    }

    this.workflowRunning.set(action);
    this.errorMessage.set('');
    call(id, { version: this.version() }).subscribe({
      next: (order) => {
        this.workflowRunning.set('');
        this.status.set(order.status);
        this.version.set(order.version);
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
