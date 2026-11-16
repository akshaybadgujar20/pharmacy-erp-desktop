import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  bindListScreenShortcuts,
  KeyboardShortcutService,
  type ShortcutBinding,
} from '../../core/keyboard';
import { ActiveScreenSearchService } from '../../core/services/active-screen-search.service';
import { AppGridComponent } from '../../components/generic/grid';
import { AppToolbarComponent } from '../../components/generic/toolbar';
import {
  GridActionEvent,
  GridFilterChange,
  GridPageChange,
} from '../../components/generic/grid/types/grid-events.types';
import { ToolbarActionEvent } from '../../components/generic/toolbar/types/toolbar-events.types';
import { toListParams } from '../../shared/utils/list-query.util';
import { SYNC_CONFLICT_GRID_CONFIG } from './sync-conflict-grid.config';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TranslatePipe } from '@ngx-translate/core';
import { resolveApiErrorMessage } from '../../core/utils/api-error-message.util';
import {
  SyncConflictAdminService,
  SyncConflictDetail,
  SyncConflictRow,
} from './sync-conflict.service';
import { AUDIT_LOG_TOOLBAR_CONFIG } from '../audit/audit-log-toolbar.config';
import { SYNC_RESOLUTION_STRATEGIES } from './sync-resolution-strategies';

@Component({
  selector: 'app-sync-conflict-list',
  standalone: true,
  imports: [
    AppToolbarComponent,
    AppGridComponent,
    DialogModule,
    ToastModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TranslatePipe,
  ],
  providers: [MessageService],
  templateUrl: './sync-conflict-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncConflictListComponent implements OnInit, OnDestroy {
  private readonly conflicts = inject(SyncConflictAdminService);
  private readonly shortcuts = inject(KeyboardShortcutService);
  private readonly activeSearch = inject(ActiveScreenSearchService);
  private readonly grid = viewChild(AppGridComponent);
  private readonly messages = inject(MessageService);
  private readonly fb = inject(FormBuilder);
  private listShortcutBinding?: ShortcutBinding;

  readonly toolbarConfig = AUDIT_LOG_TOOLBAR_CONFIG;
  readonly gridConfig = SYNC_CONFLICT_GRID_CONFIG;
  readonly resolutionStrategies = [...SYNC_RESOLUTION_STRATEGIES];

  readonly rows = signal<SyncConflictRow[]>([]);
  readonly loading = signal(false);
  readonly totalRecords = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly search = signal('');
  readonly detailVisible = signal(false);
  readonly detail = signal<SyncConflictDetail | null>(null);
  readonly resolveVisible = signal(false);
  readonly resolveTarget = signal<SyncConflictRow | null>(null);
  readonly resolving = signal(false);

  readonly resolveForm = this.fb.nonNullable.group({
    resolutionStrategy: ['SERVER_WINS', Validators.required],
    remarks: ['Resolved from UI'],
  });

  ngOnInit(): void {
    this.listShortcutBinding = bindListScreenShortcuts(this.shortcuts, this.activeSearch, {
      refresh: () => this.load(),
      focusSearch: () => this.grid()?.focusSearch(),
    });
    this.load();
  }

  ngOnDestroy(): void {
    this.listShortcutBinding?.unregister();
  }

  onToolbarAction(event: ToolbarActionEvent): void {
    if (event.action === 'refresh') {
      this.load();
    }
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

  onGridAction(event: GridActionEvent<SyncConflictRow>): void {
    if (!event.row) {
      return;
    }
    if (event.action === 'detail') {
      this.conflicts.getById(event.row.id).subscribe({
        next: (row) => {
          this.detail.set(row);
          this.detailVisible.set(true);
        },
      });
      return;
    }
    if (event.action === 'resolve') {
      this.resolveTarget.set(event.row);
      this.resolveForm.reset({
        resolutionStrategy: 'SERVER_WINS',
        remarks: 'Resolved from UI',
      });
      this.resolveVisible.set(true);
    }
  }

  closeResolve(): void {
    this.resolveVisible.set(false);
    this.resolveTarget.set(null);
  }

  submitResolve(): void {
    const row = this.resolveTarget();
    if (!row || this.resolveForm.invalid) {
      return;
    }
    const value = this.resolveForm.getRawValue();
    this.resolving.set(true);
    this.conflicts
      .resolve(row.id, row.version, value.resolutionStrategy, value.remarks)
      .subscribe({
        next: () => {
          this.resolving.set(false);
          this.closeResolve();
          this.messages.add({
            severity: 'success',
            summary: 'Conflict resolved',
          });
          this.load();
        },
        error: (error) => {
          this.resolving.set(false);
          this.messages.add({
            severity: 'error',
            summary: resolveApiErrorMessage(error),
          });
        },
      });
  }

  private load(): void {
    this.loading.set(true);
    this.conflicts.list(toListParams(this.page(), this.pageSize(), this.search())).subscribe({
      next: (result) => {
        this.rows.set(result.data);
        this.totalRecords.set(result.pagination.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}