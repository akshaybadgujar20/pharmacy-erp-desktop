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
import { SALES_RETURN_ITEM_GRID_CONFIG } from './sales-return-item-grid.config';
import { SalesReturnItem } from './sales-return-item.models';
import { SalesReturnItemService } from './sales-return-item.service';

@Component({
  selector: 'app-sales-return-items-tab',
  standalone: true,
  imports: [
    AppGridComponent,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
  ],
  templateUrl: './sales-return-items-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesReturnItemsTabComponent {
  private readonly fb = inject(FormBuilder);
  private readonly salesReturnItemService = inject(SalesReturnItemService);

  readonly returnId = input.required<string>();
  readonly editable = input(true);

  readonly gridConfig = SALES_RETURN_ITEM_GRID_CONFIG;
  readonly rows = signal<SalesReturnItem[]>([]);
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
    salesInvoiceItemId: ['', Validators.required],
    medicineId: ['', Validators.required],
    batchId: ['', Validators.required],
    unitId: ['', Validators.required],
    returnQuantity: [1, Validators.required],
    unitPrice: [0, Validators.required],
    returnReason: ['OTHER', Validators.required],
    disposition: ['RESTOCK'],
    remarks: [''],
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

  onGridAction(event: GridActionEvent<SalesReturnItem>): void {
    if (!event.row || !this.editable()) {
      return;
    }
    if (event.action === 'edit') {
      this.openEdit(event.row);
    }
    if (event.action === 'delete') {
      this.salesReturnItemService
        .delete(this.returnId(), event.row.id, event.row.version)
        .subscribe({ next: () => this.load() });
    }
  }

  openCreate(): void {
    this.editingId.set(null);
    this.editingVersion.set(0);
    this.form.reset({
      salesInvoiceItemId: '',
      medicineId: '',
      batchId: '',
      unitId: '',
      returnQuantity: 1,
      unitPrice: 0,
      returnReason: 'OTHER',
      disposition: 'RESTOCK',
      remarks: '',
    });
    this.dialogVisible.set(true);
  }

  openEdit(item: SalesReturnItem): void {
    this.editingId.set(item.id);
    this.editingVersion.set(item.version);
    this.form.patchValue({
      salesInvoiceItemId: item.salesInvoiceItemId,
      medicineId: item.medicineId,
      batchId: item.batchId,
      unitId: item.unitId,
      returnQuantity: item.returnQuantity ?? 1,
      unitPrice: item.unitPrice ?? 0,
      returnReason: item.returnReason,
      disposition: item.disposition,
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
    const returnId = this.returnId();

    if (this.editingId()) {
      this.salesReturnItemService
        .update(returnId, this.editingId()!, {
          version: this.editingVersion(),
          batchId: value.batchId,
          unitId: value.unitId,
          returnQuantity: value.returnQuantity,
          unitPrice: value.unitPrice,
          returnReason: value.returnReason,
          disposition: value.disposition,
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

    this.salesReturnItemService
      .create(returnId, {
        salesInvoiceItemId: value.salesInvoiceItemId,
        medicineId: value.medicineId,
        batchId: value.batchId,
        unitId: value.unitId,
        returnQuantity: value.returnQuantity,
        unitPrice: value.unitPrice,
        returnReason: value.returnReason,
        disposition: value.disposition,
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
    this.salesReturnItemService
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
