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
import { USER_ROLE_GRID_CONFIG } from './user-role-grid.config';
import { UserRole } from './user-role.models';
import { UserRoleService } from './user-role.service';

@Component({
  selector: 'app-user-roles-tab',
  standalone: true,
  imports: [
    AppGridComponent,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    CheckboxModule,
  ],
  templateUrl: './user-roles-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserRolesTabComponent {
  private readonly fb = inject(FormBuilder);
  private readonly userRoleService = inject(UserRoleService);

  readonly userId = input.required<string>();

  readonly gridConfig = USER_ROLE_GRID_CONFIG;
  readonly rows = signal<UserRole[]>([]);
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
    roleId: ['', Validators.required],
    isActive: [true],
  });

  constructor() {
    effect(() => {
      const id = this.userId();
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

  onGridAction(event: GridActionEvent<UserRole>): void {
    if (!event.row) {
      return;
    }
    if (event.action === 'edit') {
      this.openEdit(event.row);
    }
    if (event.action === 'delete') {
      this.userRoleService
        .delete(this.userId(), event.row.id, event.row.version)
        .subscribe({ next: () => this.load() });
    }
  }

  openCreate(): void {
    this.editingId.set(null);
    this.editingVersion.set(0);
    this.form.reset({ roleId: '', isActive: true });
    this.dialogVisible.set(true);
  }

  openEdit(userRole: UserRole): void {
    this.editingId.set(userRole.id);
    this.editingVersion.set(userRole.version);
    this.form.patchValue({
      roleId: userRole.roleId,
      isActive: userRole.isActive,
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
    const userId = this.userId();

    if (this.editingId()) {
      this.userRoleService
        .update(userId, this.editingId()!, {
          version: this.editingVersion(),
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

    this.userRoleService
      .create(userId, {
        roleId: value.roleId,
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
    this.userRoleService
      .list(this.userId(), toListParams(this.page(), this.pageSize(), this.search()))
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
