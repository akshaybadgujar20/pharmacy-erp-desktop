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
import { USER_BRANCH_GRID_CONFIG } from './user-branch-grid.config';
import { UserBranch } from './user-branch.models';
import { UserBranchService } from './user-branch.service';

@Component({
  selector: 'app-user-branches-tab',
  standalone: true,
  imports: [
    AppGridComponent,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    CheckboxModule,
  ],
  templateUrl: './user-branches-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserBranchesTabComponent {
  private readonly fb = inject(FormBuilder);
  private readonly userBranchService = inject(UserBranchService);

  readonly userId = input.required<string>();

  readonly gridConfig = USER_BRANCH_GRID_CONFIG;
  readonly rows = signal<UserBranch[]>([]);
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
    branchId: ['', Validators.required],
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

  onGridAction(event: GridActionEvent<UserBranch>): void {
    if (!event.row) {
      return;
    }
    if (event.action === 'edit') {
      this.openEdit(event.row);
    }
    if (event.action === 'delete') {
      this.userBranchService
        .delete(this.userId(), event.row.id, event.row.version)
        .subscribe({ next: () => this.load() });
    }
  }

  openCreate(): void {
    this.editingId.set(null);
    this.editingVersion.set(0);
    this.form.reset({ branchId: '', isActive: true });
    this.dialogVisible.set(true);
  }

  openEdit(userBranch: UserBranch): void {
    this.editingId.set(userBranch.id);
    this.editingVersion.set(userBranch.version);
    this.form.patchValue({
      branchId: userBranch.branchId,
      isActive: userBranch.isActive,
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
      this.userBranchService
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

    this.userBranchService
      .create(userId, {
        branchId: value.branchId,
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
    this.userBranchService
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
