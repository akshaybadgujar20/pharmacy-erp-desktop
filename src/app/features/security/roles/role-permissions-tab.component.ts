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
import { ROLE_PERMISSION_GRID_CONFIG } from './role-permission-grid.config';
import { RolePermission } from './role-permission.models';
import { RolePermissionService } from './role-permission.service';

@Component({
  selector: 'app-role-permissions-tab',
  standalone: true,
  imports: [
    AppGridComponent,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    CheckboxModule,
  ],
  templateUrl: './role-permissions-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolePermissionsTabComponent {
  private readonly fb = inject(FormBuilder);
  private readonly rolePermissionService = inject(RolePermissionService);

  readonly roleId = input.required<string>();

  readonly gridConfig = ROLE_PERMISSION_GRID_CONFIG;
  readonly rows = signal<RolePermission[]>([]);
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
    permissionId: ['', Validators.required],
    isGranted: [true],
  });

  constructor() {
    effect(() => {
      const id = this.roleId();
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

  onGridAction(event: GridActionEvent<RolePermission>): void {
    if (!event.row) {
      return;
    }
    if (event.action === 'edit') {
      this.openEdit(event.row);
    }
    if (event.action === 'delete') {
      this.rolePermissionService
        .delete(this.roleId(), event.row.id, event.row.version)
        .subscribe({ next: () => this.load() });
    }
  }

  openCreate(): void {
    this.editingId.set(null);
    this.editingVersion.set('0');
    this.form.reset({ permissionId: '', isGranted: true });
    this.dialogVisible.set(true);
  }

  openEdit(rolePermission: RolePermission): void {
    this.editingId.set(rolePermission.id);
    this.editingVersion.set(rolePermission.version);
    this.form.patchValue({
      permissionId: rolePermission.permissionId,
      isGranted: rolePermission.isGranted,
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
    const roleId = this.roleId();

    if (this.editingId()) {
      this.rolePermissionService
        .update(roleId, this.editingId()!, {
          version: this.editingVersion(),
          isGranted: value.isGranted,
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

    this.rolePermissionService
      .create(roleId, {
        permissionId: value.permissionId,
        isGranted: value.isGranted,
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
    this.rolePermissionService
      .list(this.roleId(), toListParams(this.page(), this.pageSize(), this.search()))
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
