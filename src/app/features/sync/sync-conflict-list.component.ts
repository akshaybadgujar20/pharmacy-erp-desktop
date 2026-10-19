import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { KeyboardShortcutService } from '../../core/keyboard';
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
import {
  SyncConflictAdminService,
  SyncConflictDetail,
  SyncConflictRow,
} from './sync-conflict.service';
import { AUDIT_LOG_TOOLBAR_CONFIG } from '../audit/audit-log-toolbar.config';

@Component({
  selector: 'app-sync-conflict-list',
  standalone: true,
  imports: [AppToolbarComponent, AppGridComponent, DialogModule, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast />
    <app-toolbar [config]="toolbarConfig" (action)="onToolbarAction($event)" />
    <app-grid
      [config]="gridConfig"
      [data]="rows()"
      [loading]="loading()"
      [totalRecords]="totalRecords()"
      (pageChange)="onPageChange($event)"
      (filterChange)="onFilterChange($event)"
      (action)="onGridAction($event)"
    />
    <p-dialog
      [visible]="detailVisible()"
      [modal]="true"
      header="Sync conflict"
      [style]="{ width: '48rem' }"
      (onHide)="detailVisible.set(false)"
    >
      @if (detail(); as row) {
        <p><strong>Entity:</strong> {{ row.entityType }}</p>
        <h4>Local payload</h4>
        <pre>{{ row.localPayload }}</pre>
        <h4>Server payload</h4>
        <pre>{{ row.serverPayload }}</pre>
      }
    </p-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncConflictListComponent implements OnInit, OnDestroy {
  private readonly conflicts = inject(SyncConflictAdminService);
  private readonly shortcuts = inject(KeyboardShortcutService);
  private readonly messages = inject(MessageService);

  readonly toolbarConfig = AUDIT_LOG_TOOLBAR_CONFIG;
  readonly gridConfig = SYNC_CONFLICT_GRID_CONFIG;

  readonly rows = signal<SyncConflictRow[]>([]);
  readonly loading = signal(false);
  readonly totalRecords = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly search = signal('');
  readonly detailVisible = signal(false);
  readonly detail = signal<SyncConflictDetail | null>(null);

  ngOnInit(): void {
    this.shortcuts.registerHandler('global.refresh', () => this.load());
    this.load();
  }

  ngOnDestroy(): void {
    this.shortcuts.unregisterHandler('global.refresh');
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
      this.conflicts
        .resolve(event.row.id, event.row.version, 'SERVER_WINS', 'Resolved from UI')
        .subscribe({
          next: () => {
            this.messages.add({
              severity: 'success',
              summary: 'Conflict resolved',
            });
            this.load();
          },
          error: () =>
            this.messages.add({
              severity: 'error',
              summary: 'Resolve failed',
            }),
        });
    }
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
