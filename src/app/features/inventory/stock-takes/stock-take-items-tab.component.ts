import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
import { STOCK_TAKE_ITEM_GRID_CONFIG } from './stock-take-item-grid.config';
import { StockTakeItem } from './stock-take-item.models';
import { StockTakeItemService } from './stock-take-item.service';

@Component({
  selector: 'app-stock-take-items-tab',
  standalone: true,
  imports: [
    AppGridComponent,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
  ],
  templateUrl: './stock-take-items-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockTakeItemsTabComponent {
  private readonly fb = inject(FormBuilder);
  private readonly stockTakeItemService = inject(StockTakeItemService);

  readonly stockTakeId = input.required<string>();
  readonly parentStatus = input('DRAFT');

  readonly editable = computed(() =>
    ['DRAFT', 'IN_PROGRESS'].includes(this.parentStatus()),
  );

  readonly gridConfig = STOCK_TAKE_ITEM_GRID_CONFIG;
  readonly rows = signal<StockTakeItem[]>([]);
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
    physicalQuantity: [0, Validators.required],
    remarks: [''],
  });

  constructor() {
    effect(() => {
      const id = this.stockTakeId();
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

  onGridAction(event: GridActionEvent<StockTakeItem>): void {
    if (!event.row || !this.editable()) {
      return;
    }
    if (event.action === 'edit') {
      this.openEdit(event.row);
    }
    if (event.action === 'delete') {
      this.stockTakeItemService
        .delete(this.stockTakeId(), event.row.id, event.row.version)
        .subscribe({ next: () => this.load() });
    }
  }

  openCreate(): void {
    this.editingId.set(null);
    this.editingVersion.set('0');
    this.form.reset({
      batchId: '',
      physicalQuantity: 0,
      remarks: '',
    });
    this.dialogVisible.set(true);
  }

  openEdit(item: StockTakeItem): void {
    this.editingId.set(item.id);
    this.editingVersion.set(item.version);
    this.form.patchValue({
      batchId: item.batchId,
      physicalQuantity: item.physicalQuantity,
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
    const stockTakeId = this.stockTakeId();

    if (this.editingId()) {
      this.stockTakeItemService
        .update(stockTakeId, this.editingId()!, {
          version: this.editingVersion(),
          physicalQuantity: value.physicalQuantity,
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

    this.stockTakeItemService
      .create(stockTakeId, {
        batchId: value.batchId,
        physicalQuantity: value.physicalQuantity,
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
    this.stockTakeItemService
      .list(this.stockTakeId(), toListParams(this.page(), this.pageSize(), this.search()))
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
