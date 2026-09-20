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
import { PURCHASE_ORDER_ITEM_GRID_CONFIG } from './purchase-order-item-grid.config';
import { PurchaseOrderItem } from './purchase-order-item.models';
import { PurchaseOrderItemService } from './purchase-order-item.service';

@Component({
  selector: 'app-purchase-order-items-tab',
  standalone: true,
  imports: [
    AppGridComponent,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
  ],
  templateUrl: './purchase-order-items-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseOrderItemsTabComponent {
  private readonly fb = inject(FormBuilder);
  private readonly purchaseOrderItemService = inject(PurchaseOrderItemService);

  readonly orderId = input.required<string>();
  readonly editable = input(true);

  readonly gridConfig = PURCHASE_ORDER_ITEM_GRID_CONFIG;
  readonly rows = signal<PurchaseOrderItem[]>([]);
  readonly loading = signal(false);
  readonly totalRecords = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly search = signal('');
  readonly dialogVisible = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly editingVersion = signal('0');
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    medicineId: ['', Validators.required],
    unitId: ['', Validators.required],
    orderedQuantity: [0, Validators.required],
    unitPrice: [0, Validators.required],
  });

  constructor() {
    effect(() => {
      const id = this.orderId();
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

  onGridAction(event: GridActionEvent<PurchaseOrderItem>): void {
    if (!event.row || !this.editable()) {
      return;
    }
    if (event.action === 'edit') {
      this.openEdit(event.row);
    }
    if (event.action === 'delete') {
      this.purchaseOrderItemService
        .delete(this.orderId(), event.row.id, event.row.version)
        .subscribe({ next: () => this.load() });
    }
  }

  openCreate(): void {
    this.editingId.set(null);
    this.editingVersion.set('0');
    this.form.reset({
      medicineId: '',
      unitId: '',
      orderedQuantity: 0,
      unitPrice: 0,
    });
    this.dialogVisible.set(true);
  }

  openEdit(item: PurchaseOrderItem): void {
    this.editingId.set(item.id);
    this.editingVersion.set(item.version);
    this.form.patchValue({
      medicineId: item.medicineId,
      unitId: item.unitId,
      orderedQuantity: item.orderedQuantity ?? 0,
      unitPrice: item.unitPrice ?? 0,
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
    const orderId = this.orderId();

    if (this.editingId()) {
      this.purchaseOrderItemService
        .update(orderId, this.editingId()!, {
          version: this.editingVersion(),
          unitId: value.unitId,
          orderedQuantity: value.orderedQuantity,
          unitPrice: value.unitPrice,
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

    this.purchaseOrderItemService
      .create(orderId, {
        medicineId: value.medicineId,
        unitId: value.unitId,
        orderedQuantity: value.orderedQuantity,
        unitPrice: value.unitPrice,
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

  private load(): void {
    this.loading.set(true);
    this.purchaseOrderItemService
      .list(this.orderId(), toListParams(this.page(), this.pageSize(), this.search()))
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
