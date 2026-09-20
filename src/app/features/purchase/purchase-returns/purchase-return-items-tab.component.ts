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
import { PURCHASE_RETURN_ITEM_GRID_CONFIG } from './purchase-return-item-grid.config';
import { PurchaseReturnItem } from './purchase-return-item.models';
import { PurchaseReturnItemService } from './purchase-return-item.service';

@Component({
  selector: 'app-purchase-return-items-tab',
  standalone: true,
  imports: [
    AppGridComponent,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
  ],
  templateUrl: './purchase-return-items-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseReturnItemsTabComponent {
  private readonly fb = inject(FormBuilder);
  private readonly purchaseReturnItemService = inject(PurchaseReturnItemService);

  readonly returnId = input.required<string>();
  readonly editable = input(true);

  readonly gridConfig = PURCHASE_RETURN_ITEM_GRID_CONFIG;
  readonly rows = signal<PurchaseReturnItem[]>([]);
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
    batchId: ['', Validators.required],
    unitId: ['', Validators.required],
    returnQuantity: [0, Validators.required],
    unitPrice: [0, Validators.required],
  });

  constructor() {
    effect(() => {
      const id = this.returnId();
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

  onGridAction(event: GridActionEvent<PurchaseReturnItem>): void {
    if (!event.row || !this.editable()) {
      return;
    }
    if (event.action === 'edit') {
      this.openEdit(event.row);
    }
    if (event.action === 'delete') {
      this.purchaseReturnItemService
        .delete(this.returnId(), event.row.id, event.row.version)
        .subscribe({ next: () => this.load() });
    }
  }

  openCreate(): void {
    this.editingId.set(null);
    this.editingVersion.set('0');
    this.form.reset({
      medicineId: '',
      batchId: '',
      unitId: '',
      returnQuantity: 0,
      unitPrice: 0,
    });
    this.dialogVisible.set(true);
  }

  openEdit(item: PurchaseReturnItem): void {
    this.editingId.set(item.id);
    this.editingVersion.set(item.version);
    this.form.patchValue({
      medicineId: item.medicineId,
      batchId: item.batchId,
      unitId: item.unitId,
      returnQuantity: item.returnQuantity ?? 0,
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
    const returnId = this.returnId();

    if (this.editingId()) {
      this.purchaseReturnItemService
        .update(returnId, this.editingId()!, {
          version: this.editingVersion(),
          batchId: value.batchId,
          unitId: value.unitId,
          returnQuantity: value.returnQuantity,
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

    this.purchaseReturnItemService
      .create(returnId, {
        medicineId: value.medicineId,
        batchId: value.batchId,
        unitId: value.unitId,
        returnQuantity: value.returnQuantity,
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
    this.purchaseReturnItemService
      .list(this.returnId(), toListParams(this.page(), this.pageSize(), this.search()))
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
