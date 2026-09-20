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
import { GridActionEvent, GridFilterChange, GridPageChange } from '../../../components/generic/grid/types/grid-events.types';
import { toListParams } from '../../../shared/utils/list-query.util';
import { PARTY_ROLE_GRID_CONFIG } from './party-role-grid.config';
import { PartyRole } from './party-role.models';
import { PartyRoleService } from './party-role.service';

@Component({
  selector: 'app-party-roles-tab',
  standalone: true,
  imports: [
    AppGridComponent,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    CheckboxModule,
  ],
  templateUrl: './party-roles-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartyRolesTabComponent {
  private readonly fb = inject(FormBuilder);
  private readonly partyRoleService = inject(PartyRoleService);

  readonly partyId = input.required<string>();

  readonly gridConfig = PARTY_ROLE_GRID_CONFIG;
  readonly rows = signal<PartyRole[]>([]);
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
    roleType: ['', Validators.required],
    isPrimary: [false],
    isActive: [true],
  });

  constructor() {
    effect(() => {
      const id = this.partyId();
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

  onGridAction(event: GridActionEvent<PartyRole>): void {
    if (!event.row) {
      return;
    }
    if (event.action === 'edit') {
      this.openEdit(event.row);
    }
    if (event.action === 'delete') {
      this.partyRoleService
        .delete(this.partyId(), event.row.id, event.row.version)
        .subscribe({ next: () => this.load() });
    }
  }

  openCreate(): void {
    this.editingId.set(null);
    this.editingVersion.set('0');
    this.form.reset({ roleType: '', isPrimary: false, isActive: true });
    this.dialogVisible.set(true);
  }

  openEdit(role: PartyRole): void {
    this.editingId.set(role.id);
    this.editingVersion.set(role.version);
    this.form.patchValue({
      roleType: role.roleType,
      isPrimary: role.isPrimary,
      isActive: role.isActive,
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
    const partyId = this.partyId();

    if (this.editingId()) {
      this.partyRoleService
        .update(partyId, this.editingId()!, {
          version: this.editingVersion(),
          roleType: value.roleType,
          isPrimary: value.isPrimary,
          isActive: value.isActive,
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

    this.partyRoleService
      .create(partyId, {
        roleType: value.roleType,
        isPrimary: value.isPrimary,
        isActive: value.isActive,
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
    this.partyRoleService
      .list(this.partyId(), toListParams(this.page(), this.pageSize(), this.search()))
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
