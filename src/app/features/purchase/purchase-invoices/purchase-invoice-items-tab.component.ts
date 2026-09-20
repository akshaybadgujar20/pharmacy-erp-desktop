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
import { PURCHASE_INVOICE_ITEM_GRID_CONFIG } from './purchase-invoice-item-grid.config';
import { PurchaseInvoiceItem } from './purchase-invoice-item.models';
import { PurchaseInvoiceItemService } from './purchase-invoice-item.service';

@Component({
  selector: 'app-purchase-invoice-items-tab',
  standalone: true,
  imports: [
    AppGridComponent,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
  ],
  templateUrl: './purchase-invoice-items-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseInvoiceItemsTabComponent {
  private readonly fb = inject(FormBuilder);
  private readonly purchaseInvoiceItemService = inject(PurchaseInvoiceItemService);

  readonly invoiceId = input.required<string>();
  readonly editable = input(true);

  readonly gridConfig = PURCHASE_INVOICE_ITEM_GRID_CONFIG;
  readonly rows = signal<PurchaseInvoiceItem[]>([]);
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
    invoiceQuantity: [0, Validators.required],
    unitPrice: [0, Validators.required],
    mrp: [0, Validators.required],
  });

  constructor() {
    effect(() => {
      const id = this.invoiceId();
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

  onGridAction(event: GridActionEvent<PurchaseInvoiceItem>): void {
    if (!event.row || !this.editable()) {
      return;
    }
    if (event.action === 'edit') {
      this.openEdit(event.row);
    }
    if (event.action === 'delete') {
      this.purchaseInvoiceItemService
        .delete(this.invoiceId(), event.row.id, event.row.version)
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
      invoiceQuantity: 0,
      unitPrice: 0,
      mrp: 0,
    });
    this.dialogVisible.set(true);
  }

  openEdit(item: PurchaseInvoiceItem): void {
    this.editingId.set(item.id);
    this.editingVersion.set(item.version);
    this.form.patchValue({
      medicineId: item.medicineId,
      batchId: item.batchId,
      unitId: item.unitId,
      invoiceQuantity: item.invoiceQuantity ?? 0,
      unitPrice: item.unitPrice ?? 0,
      mrp: item.mrp ?? 0,
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
    const invoiceId = this.invoiceId();

    if (this.editingId()) {
      this.purchaseInvoiceItemService
        .update(invoiceId, this.editingId()!, {
          version: this.editingVersion(),
          batchId: value.batchId,
          unitId: value.unitId,
          invoiceQuantity: value.invoiceQuantity,
          unitPrice: value.unitPrice,
          mrp: value.mrp,
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

    this.purchaseInvoiceItemService
      .create(invoiceId, {
        medicineId: value.medicineId,
        batchId: value.batchId,
        unitId: value.unitId,
        invoiceQuantity: value.invoiceQuantity,
        unitPrice: value.unitPrice,
        mrp: value.mrp,
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
    this.purchaseInvoiceItemService
      .list(this.invoiceId(), toListParams(this.page(), this.pageSize(), this.search()))
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
