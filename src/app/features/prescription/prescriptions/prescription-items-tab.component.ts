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
import { PRESCRIPTION_ITEM_GRID_CONFIG } from './prescription-item-grid.config';
import { PrescriptionItem } from './prescription-item.models';
import { PrescriptionItemService } from './prescription-item.service';

@Component({
  selector: 'app-prescription-items-tab',
  standalone: true,
  imports: [
    AppGridComponent,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
  ],
  templateUrl: './prescription-items-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrescriptionItemsTabComponent {
  private readonly fb = inject(FormBuilder);
  private readonly prescriptionItemService = inject(PrescriptionItemService);

  readonly prescriptionId = input.required<string>();

  readonly gridConfig = PRESCRIPTION_ITEM_GRID_CONFIG;
  readonly rows = signal<PrescriptionItem[]>([]);
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
    unitId: ['', Validators.required],
    lineNumber: [1, Validators.required],
    prescribedQuantity: ['', Validators.required],
    dosage: [''],
    frequency: [''],
    duration: [''],
    route: [''],
    instructions: [''],
    remarks: [''],
  });

  constructor() {
    effect(() => {
      const id = this.prescriptionId();
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

  onGridAction(event: GridActionEvent<PrescriptionItem>): void {
    if (!event.row) {
      return;
    }
    if (event.action === 'edit') {
      this.openEdit(event.row);
    }
    if (event.action === 'delete') {
      this.prescriptionItemService
        .delete(this.prescriptionId(), event.row.id, event.row.version)
        .subscribe({ next: () => this.load() });
    }
  }

  openCreate(): void {
    this.editingId.set(null);
    this.editingVersion.set(0);
    this.form.reset({
      medicineId: '',
      unitId: '',
      lineNumber: 1,
      prescribedQuantity: '',
      dosage: '',
      frequency: '',
      duration: '',
      route: '',
      instructions: '',
      remarks: '',
    });
    this.dialogVisible.set(true);
  }

  openEdit(item: PrescriptionItem): void {
    this.editingId.set(item.id);
    this.editingVersion.set(item.version);
    this.form.patchValue({
      medicineId: item.medicineId,
      unitId: item.unitId,
      lineNumber: item.lineNumber,
      prescribedQuantity: item.prescribedQuantity,
      dosage: item.dosage ?? '',
      frequency: item.frequency ?? '',
      duration: item.duration ?? '',
      route: item.route ?? '',
      instructions: item.instructions ?? '',
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
    const prescriptionId = this.prescriptionId();

    if (this.editingId()) {
      this.prescriptionItemService
        .update(prescriptionId, this.editingId()!, {
          version: this.editingVersion(),
          medicineId: value.medicineId,
          unitId: value.unitId,
          lineNumber: value.lineNumber,
          prescribedQuantity: value.prescribedQuantity,
          dosage: value.dosage || undefined,
          frequency: value.frequency || undefined,
          duration: value.duration || undefined,
          route: value.route || undefined,
          instructions: value.instructions || undefined,
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

    this.prescriptionItemService
      .create(prescriptionId, {
        medicineId: value.medicineId,
        unitId: value.unitId,
        lineNumber: value.lineNumber,
        prescribedQuantity: value.prescribedQuantity,
        dosage: value.dosage || undefined,
        frequency: value.frequency || undefined,
        duration: value.duration || undefined,
        route: value.route || undefined,
        instructions: value.instructions || undefined,
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
    this.prescriptionItemService
      .list(this.prescriptionId(), toListParams(this.page(), this.pageSize(), this.search()))
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
