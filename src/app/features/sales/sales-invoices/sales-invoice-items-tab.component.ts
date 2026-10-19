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
import { BatchService } from '../../inventory/batches/batch.service';
import { MedicineService } from '../../medicine/medicines/medicine.service';
import { MedicineLookupComponent } from '../../../shared/lookups/medicine-lookup.component';
import { toListParams } from '../../../shared/utils/list-query.util';
import { SALES_INVOICE_ITEM_GRID_CONFIG } from './sales-invoice-item-grid.config';
import { SalesInvoiceItem } from './sales-invoice-item.models';
import { SalesInvoiceItemService } from './sales-invoice-item.service';

@Component({
  selector: 'app-sales-invoice-items-tab',
  standalone: true,
  imports: [
    AppGridComponent,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    MedicineLookupComponent,
  ],
  templateUrl: './sales-invoice-items-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesInvoiceItemsTabComponent {
  private readonly fb = inject(FormBuilder);
  private readonly salesInvoiceItemService = inject(SalesInvoiceItemService);
  private readonly batchService = inject(BatchService);
  private readonly medicineService = inject(MedicineService);

  readonly invoiceId = input.required<string>();
  readonly editable = input(true);
  readonly seedMedicineId = input<string | null>(null);
  readonly seedSoldQuantity = input<number | null>(null);
  readonly seedToken = input(0);

  readonly gridConfig = SALES_INVOICE_ITEM_GRID_CONFIG;
  readonly rows = signal<SalesInvoiceItem[]>([]);
  readonly loading = signal(false);
  readonly totalRecords = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly search = signal('');
  readonly dialogVisible = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly editingVersion = signal('0');
  readonly saving = signal(false);
  readonly batchOptions = signal<{ id: string; label: string }[]>([]);

  readonly form = this.fb.nonNullable.group({
    medicineId: ['', Validators.required],
    batchId: ['', Validators.required],
    unitId: ['', Validators.required],
    soldQuantity: [1, Validators.required],
    remarks: [''],
  });

  constructor() {
    effect(() => {
      const id = this.invoiceId();
      if (id) {
        this.load();
      }
    });
    effect(() => {
      const medicineId = this.seedMedicineId();
      const seedToken = this.seedToken();
      if (!medicineId || !this.editable() || seedToken === 0) {
        return;
      }
      const soldQuantity = this.seedSoldQuantity() ?? 1;
      this.openCreate();
      this.form.patchValue({ medicineId, soldQuantity });
      this.onMedicineChange(medicineId);
    });
    this.form.get('medicineId')?.valueChanges.subscribe((medicineId) => {
      this.onMedicineChange(medicineId || null);
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

  onGridAction(event: GridActionEvent<SalesInvoiceItem>): void {
    if (!event.row || !this.editable()) {
      return;
    }
    if (event.action === 'edit') {
      this.openEdit(event.row);
    }
    if (event.action === 'delete') {
      this.salesInvoiceItemService
        .delete(this.invoiceId(), event.row.id, event.row.version)
        .subscribe({ next: () => this.load() });
    }
  }

  onMedicineChange(medicineId: string | null): void {
    if (!medicineId) {
      this.batchOptions.set([]);
      return;
    }
    this.medicineService.getById(medicineId).subscribe({
      next: (medicine) => this.form.patchValue({ unitId: medicine.unitId }),
    });
    this.batchService
      .list({ medicineId, page: '1', pageSize: '50' })
      .subscribe({
        next: ({ data }) => {
          const sorted = [...data].sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
          this.batchOptions.set(
            sorted.map((batch) => ({
              id: batch.id,
              label: `${batch.batchNumber} (exp ${batch.expiryDate})`,
            })),
          );
          if (sorted[0]) {
            this.form.patchValue({ batchId: sorted[0].id });
          }
        },
      });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.editingVersion.set('0');
    this.form.reset({
      medicineId: '',
      batchId: '',
      unitId: '',
      soldQuantity: 1,
      remarks: '',
    });
    this.batchOptions.set([]);
    this.dialogVisible.set(true);
  }

  openEdit(item: SalesInvoiceItem): void {
    this.editingId.set(item.id);
    this.editingVersion.set(item.version);
    this.form.patchValue({
      medicineId: item.medicineId,
      batchId: item.batchId,
      unitId: item.unitId,
      soldQuantity: item.soldQuantity ?? 1,
      remarks: item.remarks ?? '',
    });
    this.onMedicineChange(item.medicineId);
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
      this.salesInvoiceItemService
        .update(invoiceId, this.editingId()!, {
          version: this.editingVersion(),
          batchId: value.batchId,
          unitId: value.unitId,
          soldQuantity: value.soldQuantity,
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

    this.salesInvoiceItemService
      .create(invoiceId, {
        medicineId: value.medicineId,
        batchId: value.batchId,
        unitId: value.unitId,
        soldQuantity: value.soldQuantity,
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
    this.salesInvoiceItemService
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
