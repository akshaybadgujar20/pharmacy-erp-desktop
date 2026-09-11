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
import { STOCK_ADJUSTMENT_ITEM_GRID_CONFIG } from './stock-adjustment-item-grid.config';
import { StockAdjustmentItem } from './stock-adjustment-item.models';
import { StockAdjustmentItemService } from './stock-adjustment-item.service';

@Component({
  selector: 'app-stock-adjustment-items-tab',
  standalone: true,
  imports: [
    AppGridComponent,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
  ],
  templateUrl: './stock-adjustment-items-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockAdjustmentItemsTabComponent {
  private readonly fb = inject(FormBuilder);
  private readonly stockAdjustmentItemService = inject(StockAdjustmentItemService);

  readonly adjustmentId = input.required<string>();
  readonly editable = input(true);

  readonly gridConfig = STOCK_ADJUSTMENT_ITEM_GRID_CONFIG;
  readonly rows = signal<StockAdjustmentItem[]>([]);
  readonly loading = signal(false);
  readonly totalRecords = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly search = signal('');
  readonly dialogVisible = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly editingVersion = signal(0);
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    batchId: ['', Validators.required],
    quantity: [0, Validators.required],
    unitCost: [0, Validators.required],
    remarks: [''],
  });

  constructor() {
    effect(() => {
      const id = this.adjustmentId();
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

  onGridAction(event: GridActionEvent<StockAdjustmentItem>): void {
    if (!event.row || !this.editable()) {
      return;
    }
    if (event.action === 'edit') {
      this.openEdit(event.row);
    }
    if (event.action === 'delete') {
      this.stockAdjustmentItemService
        .delete(this.adjustmentId(), event.row.id, event.row.version)
        .subscribe({ next: () => this.load() });
    }
  }

  openCreate(): void {
    this.editingId.set(null);
    this.editingVersion.set(0);
    this.form.reset({
      batchId: '',
      quantity: 0,
      unitCost: 0,
      remarks: '',
    });
    this.dialogVisible.set(true);
  }

  openEdit(item: StockAdjustmentItem): void {
    this.editingId.set(item.id);
    this.editingVersion.set(item.version);
    this.form.patchValue({
      batchId: item.batchId,
      quantity: item.quantity,
      unitCost: item.unitCost,
      remarks: item.remarks ?? '',
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
    const adjustmentId = this.adjustmentId();

    if (this.editingId()) {
      this.stockAdjustmentItemService
        .update(adjustmentId, this.editingId()!, {
          version: this.editingVersion(),
          quantity: value.quantity,
          unitCost: value.unitCost,
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

    this.stockAdjustmentItemService
      .create(adjustmentId, {
        batchId: value.batchId,
        quantity: value.quantity,
        unitCost: value.unitCost,
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

  private load(): void {
    this.loading.set(true);
    this.stockAdjustmentItemService
      .list(this.adjustmentId(), toListParams(this.page(), this.pageSize(), this.search()))
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
