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
import { STOCK_TRANSFER_ITEM_GRID_CONFIG } from './stock-transfer-item-grid.config';
import { StockTransferItem } from './stock-transfer-item.models';
import { StockTransferItemService } from './stock-transfer-item.service';

@Component({
  selector: 'app-stock-transfer-items-tab',
  standalone: true,
  imports: [
    AppGridComponent,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
  ],
  templateUrl: './stock-transfer-items-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockTransferItemsTabComponent {
  private readonly fb = inject(FormBuilder);
  private readonly stockTransferItemService = inject(StockTransferItemService);

  readonly transferId = input.required<string>();
  readonly editable = input(true);

  readonly gridConfig = STOCK_TRANSFER_ITEM_GRID_CONFIG;
  readonly rows = signal<StockTransferItem[]>([]);
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
    batchId: ['', Validators.required],
    sentQuantity: [0, Validators.required],
    receivedQuantity: [null as number | null],
    damagedQuantity: [0],
    remarks: [''],
  });

  constructor() {
    effect(() => {
      const id = this.transferId();
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

  onGridAction(event: GridActionEvent<StockTransferItem>): void {
    if (!event.row || !this.editable()) {
      return;
    }
    if (event.action === 'edit') {
      this.openEdit(event.row);
    }
    if (event.action === 'delete') {
      this.stockTransferItemService
        .delete(this.transferId(), event.row.id, event.row.version)
        .subscribe({ next: () => this.load() });
    }
  }

  openCreate(): void {
    this.editingId.set(null);
    this.editingVersion.set('0');
    this.form.reset({
      batchId: '',
      sentQuantity: 0,
      receivedQuantity: null,
      damagedQuantity: 0,
      remarks: '',
    });
    this.dialogVisible.set(true);
  }

  openEdit(item: StockTransferItem): void {
    this.editingId.set(item.id);
    this.editingVersion.set(item.version);
    this.form.patchValue({
      batchId: item.batchId,
      sentQuantity: item.sentQuantity,
      receivedQuantity: item.receivedQuantity,
      damagedQuantity: item.damagedQuantity,
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
    const transferId = this.transferId();

    if (this.editingId()) {
      this.stockTransferItemService
        .update(transferId, this.editingId()!, {
          version: this.editingVersion(),
          sentQuantity: value.sentQuantity,
          receivedQuantity: value.receivedQuantity ?? undefined,
          damagedQuantity: value.damagedQuantity,
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

    this.stockTransferItemService
      .create(transferId, {
        batchId: value.batchId,
        sentQuantity: value.sentQuantity,
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
    this.stockTransferItemService
      .list(this.transferId(), toListParams(this.page(), this.pageSize(), this.search()))
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
