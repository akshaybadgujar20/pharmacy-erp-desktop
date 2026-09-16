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
import { GridActionEvent, GridFilterChange, GridPageChange } from '../../../components/generic/grid/types/grid-events.types';
import { toListParams } from '../../../shared/utils/list-query.util';
import { MEDICINE_SALT_GRID_CONFIG } from './medicine-salt-grid.config';
import { MedicineSalt } from './medicine-salt.models';
import { MedicineSaltService } from './medicine-salt.service';

@Component({
  selector: 'app-medicine-salts-tab',
  standalone: true,
  imports: [
    AppGridComponent,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
  ],
  templateUrl: './medicine-salts-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MedicineSaltsTabComponent {
  private readonly fb = inject(FormBuilder);
  private readonly medicineSaltService = inject(MedicineSaltService);

  readonly medicineId = input.required<string>();

  readonly gridConfig = MEDICINE_SALT_GRID_CONFIG;
  readonly rows = signal<MedicineSalt[]>([]);
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
    saltCompositionId: ['', Validators.required],
    sequenceNo: [1, Validators.required],
    percentage: [''],
  });

  constructor() {
    effect(() => {
      const id = this.medicineId();
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

  onGridAction(event: GridActionEvent<MedicineSalt>): void {
    if (!event.row) {
      return;
    }
    if (event.action === 'edit') {
      this.openEdit(event.row);
    }
    if (event.action === 'delete') {
      this.medicineSaltService
        .delete(this.medicineId(), event.row.id, event.row.version)
        .subscribe({ next: () => this.load() });
    }
  }

  openCreate(): void {
    this.editingId.set(null);
    this.editingVersion.set(0);
    this.form.reset({ saltCompositionId: '', sequenceNo: 1, percentage: '' });
    this.dialogVisible.set(true);
  }

  openEdit(salt: MedicineSalt): void {
    this.editingId.set(salt.id);
    this.editingVersion.set(salt.version);
    this.form.patchValue({
      saltCompositionId: salt.saltCompositionId,
      sequenceNo: salt.sequenceNo,
      percentage: salt.percentage ?? '',
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
    const medicineId = this.medicineId();
    const percentage = value.percentage.trim() ? value.percentage : null;

    if (this.editingId()) {
      this.medicineSaltService
        .update(medicineId, this.editingId()!, {
          version: this.editingVersion(),
          saltCompositionId: value.saltCompositionId,
          sequenceNo: value.sequenceNo,
          percentage,
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

    this.medicineSaltService
      .create(medicineId, {
        saltCompositionId: value.saltCompositionId,
        sequenceNo: value.sequenceNo,
        percentage,
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
    this.medicineSaltService
      .list(this.medicineId(), toListParams(this.page(), this.pageSize(), this.search()))
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
