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
import { toEpochMs } from '../purchase-date.util';
import { GOODS_RECEIPT_ITEM_GRID_CONFIG } from './goods-receipt-item-grid.config';
import { GoodsReceiptItem } from './goods-receipt-item.models';
import { GoodsReceiptItemService } from './goods-receipt-item.service';

@Component({
  selector: 'app-goods-receipt-items-tab',
  standalone: true,
  imports: [
    AppGridComponent,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
  ],
  templateUrl: './goods-receipt-items-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoodsReceiptItemsTabComponent {
  private readonly fb = inject(FormBuilder);
  private readonly goodsReceiptItemService = inject(GoodsReceiptItemService);

  readonly goodsReceiptId = input.required<string>();
  readonly editable = input(true);

  readonly gridConfig = GOODS_RECEIPT_ITEM_GRID_CONFIG;
  readonly rows = signal<GoodsReceiptItem[]>([]);
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
    batchNumber: ['', Validators.required],
    expiryDate: ['', Validators.required],
    receivedQuantity: [0, Validators.required],
    acceptedQuantity: [0, Validators.required],
    purchaseRate: [0, Validators.required],
    mrp: [0, Validators.required],
    saleRate: [0, Validators.required],
  });

  constructor() {
    effect(() => {
      const id = this.goodsReceiptId();
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

  onGridAction(event: GridActionEvent<GoodsReceiptItem>): void {
    if (!event.row || !this.editable()) {
      return;
    }
    if (event.action === 'edit') {
      this.openEdit(event.row);
    }
    if (event.action === 'delete') {
      this.goodsReceiptItemService
        .delete(this.goodsReceiptId(), event.row.id, event.row.version)
        .subscribe({ next: () => this.load() });
    }
  }

  openCreate(): void {
    this.editingId.set(null);
    this.editingVersion.set('0');
    this.form.reset({
      medicineId: '',
      unitId: '',
      batchNumber: '',
      expiryDate: '',
      receivedQuantity: 0,
      acceptedQuantity: 0,
      purchaseRate: 0,
      mrp: 0,
      saleRate: 0,
    });
    this.dialogVisible.set(true);
  }

  openEdit(item: GoodsReceiptItem): void {
    this.editingId.set(item.id);
    this.editingVersion.set(item.version);
    this.form.patchValue({
      medicineId: item.medicineId,
      unitId: item.unitId,
      batchNumber: item.batchNumber,
      expiryDate: item.expiryDate,
      receivedQuantity: item.receivedQuantity ?? 0,
      acceptedQuantity: item.acceptedQuantity ?? 0,
      purchaseRate: item.purchaseRate ?? 0,
      mrp: item.mrp ?? 0,
      saleRate: item.saleRate ?? 0,
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
    const goodsReceiptId = this.goodsReceiptId();

    if (this.editingId()) {
      this.goodsReceiptItemService
        .update(goodsReceiptId, this.editingId()!, {
          version: this.editingVersion(),
          unitId: value.unitId,
          batchNumber: value.batchNumber,
          expiryDate: toEpochMs(value.expiryDate),
          receivedQuantity: value.receivedQuantity,
          acceptedQuantity: value.acceptedQuantity,
          purchaseRate: value.purchaseRate,
          mrp: value.mrp,
          saleRate: value.saleRate,
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

    this.goodsReceiptItemService
      .create(goodsReceiptId, {
        medicineId: value.medicineId,
        unitId: value.unitId,
        batchNumber: value.batchNumber,
        expiryDate: toEpochMs(value.expiryDate),
        receivedQuantity: value.receivedQuantity,
        acceptedQuantity: value.acceptedQuantity,
        purchaseRate: value.purchaseRate,
        mrp: value.mrp,
        saleRate: value.saleRate,
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
    this.goodsReceiptItemService
      .list(this.goodsReceiptId(), toListParams(this.page(), this.pageSize(), this.search()))
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
