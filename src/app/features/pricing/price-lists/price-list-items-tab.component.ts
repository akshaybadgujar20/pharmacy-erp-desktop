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
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { AppGridComponent } from '../../../components/generic/grid';
import {
  GridActionEvent,
  GridFilterChange,
  GridPageChange,
} from '../../../components/generic/grid/types/grid-events.types';
import { toListParams } from '../../../shared/utils/list-query.util';
import {
  nullableEpochMs,
  optionalEpochMs,
  toEpochMs,
} from '../pricing-date.util';
import { PRICE_LIST_ITEM_GRID_CONFIG } from './price-list-item-grid.config';
import { PriceListItem } from './price-list-item.models';
import { PriceListItemService } from './price-list-item.service';

@Component({
  selector: 'app-price-list-items-tab',
  standalone: true,
  imports: [
    AppGridComponent,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    CheckboxModule,
  ],
  templateUrl: './price-list-items-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriceListItemsTabComponent {
  private readonly fb = inject(FormBuilder);
  private readonly priceListItemService = inject(PriceListItemService);

  readonly priceListId = input.required<string>();

  readonly gridConfig = PRICE_LIST_ITEM_GRID_CONFIG;
  readonly rows = signal<PriceListItem[]>([]);
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
    medicineId: ['', Validators.required],
    sellingPrice: ['', Validators.required],
    mrp: ['', Validators.required],
    minimumSellingPrice: [''],
    discountPercent: [''],
    taxId: [''],
    effectiveFrom: ['', Validators.required],
    effectiveTo: [''],
    isActive: [true],
    remarks: [''],
  });

  constructor() {
    effect(() => {
      const id = this.priceListId();
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

  onGridAction(event: GridActionEvent<PriceListItem>): void {
    if (!event.row) {
      return;
    }
    if (event.action === 'edit') {
      this.openEdit(event.row);
    }
    if (event.action === 'delete') {
      this.priceListItemService
        .delete(this.priceListId(), event.row.id, event.row.version)
        .subscribe({ next: () => this.load() });
    }
  }

  openCreate(): void {
    this.editingId.set(null);
    this.editingVersion.set(0);
    this.form.reset({
      medicineId: '',
      sellingPrice: '',
      mrp: '',
      minimumSellingPrice: '',
      discountPercent: '',
      taxId: '',
      effectiveFrom: new Date().toISOString(),
      effectiveTo: '',
      isActive: true,
      remarks: '',
    });
    this.dialogVisible.set(true);
  }

  openEdit(item: PriceListItem): void {
    this.editingId.set(item.id);
    this.editingVersion.set(item.version);
    this.form.patchValue({
      medicineId: item.medicineId,
      sellingPrice: item.sellingPrice,
      mrp: item.mrp,
      minimumSellingPrice: item.minimumSellingPrice ?? '',
      discountPercent: item.discountPercent ?? '',
      taxId: item.taxId ?? '',
      effectiveFrom: item.effectiveFrom,
      effectiveTo: item.effectiveTo ?? '',
      isActive: item.isActive,
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
    const priceListId = this.priceListId();

    if (this.editingId()) {
      this.priceListItemService
        .update(priceListId, this.editingId()!, {
          version: this.editingVersion(),
          medicineId: value.medicineId,
          sellingPrice: value.sellingPrice,
          mrp: value.mrp,
          minimumSellingPrice: value.minimumSellingPrice || undefined,
          discountPercent: value.discountPercent || undefined,
          taxId: value.taxId || null,
          effectiveFrom: optionalEpochMs(value.effectiveFrom),
          effectiveTo: nullableEpochMs(value.effectiveTo),
          isActive: value.isActive,
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

    this.priceListItemService
      .create(priceListId, {
        medicineId: value.medicineId,
        sellingPrice: value.sellingPrice,
        mrp: value.mrp,
        minimumSellingPrice: value.minimumSellingPrice || undefined,
        discountPercent: value.discountPercent || undefined,
        taxId: value.taxId || undefined,
        effectiveFrom: toEpochMs(value.effectiveFrom),
        effectiveTo: optionalEpochMs(value.effectiveTo),
        isActive: value.isActive,
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
    this.priceListItemService
      .list(this.priceListId(), toListParams(this.page(), this.pageSize(), this.search()))
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
