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
import { SyncConflictAdminService, SyncConflictRow } from './sync-conflict.service';
import { AUDIT_LOG_TOOLBAR_CONFIG } from '../audit/audit-log-toolbar.config';

@Component({
  selector: 'app-sync-conflict-list',
  standalone: true,
  imports: [AppToolbarComponent, AppGridComponent],
  template: `
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
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncConflictListComponent implements OnInit, OnDestroy {
  private readonly conflicts = inject(SyncConflictAdminService);
  private readonly shortcuts = inject(KeyboardShortcutService);

  readonly toolbarConfig = AUDIT_LOG_TOOLBAR_CONFIG;
  readonly gridConfig = SYNC_CONFLICT_GRID_CONFIG;

  readonly rows = signal<SyncConflictRow[]>([]);
  readonly loading = signal(false);
  readonly totalRecords = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly search = signal('');

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
    if (!event.row || event.action !== 'resolve') {
      return;
    }
    this.conflicts.resolve(event.row.id, event.row.version, 'Resolved from UI').subscribe({
      next: () => this.load(),
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
