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
  GridFilterChange,
  GridPageChange,
} from '../../components/generic/grid/types/grid-events.types';
import { ToolbarActionEvent } from '../../components/generic/toolbar/types/toolbar-events.types';
import { toListParams } from '../../shared/utils/list-query.util';
import { DialogModule } from 'primeng/dialog';
import { GridRowClickEvent } from '../../components/generic/grid/types/grid-events.types';
import { AUDIT_LOG_GRID_CONFIG } from './audit-log-grid.config';
import { AUDIT_LOG_TOOLBAR_CONFIG } from './audit-log-toolbar.config';
import { AuditLogRow, AuditLogService } from './audit-log.service';

@Component({
  selector: 'app-audit-log-list',
  standalone: true,
  imports: [AppToolbarComponent, AppGridComponent, DialogModule],
  templateUrl: './audit-log-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogListComponent implements OnInit, OnDestroy {
  private readonly auditLogs = inject(AuditLogService);
  private readonly shortcuts = inject(KeyboardShortcutService);

  readonly toolbarConfig = AUDIT_LOG_TOOLBAR_CONFIG;
  readonly gridConfig = AUDIT_LOG_GRID_CONFIG;

  readonly rows = signal<AuditLogRow[]>([]);
  readonly loading = signal(false);
  readonly totalRecords = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly search = signal('');
  readonly detailVisible = signal(false);
  readonly detailRow = signal<AuditLogRow | null>(null);

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

  onRowClick(event: GridRowClickEvent<AuditLogRow>): void {
    this.auditLogs.getById(event.row.id).subscribe({
      next: (row) => {
        this.detailRow.set(row);
        this.detailVisible.set(true);
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.auditLogs.list(toListParams(this.page(), this.pageSize(), this.search())).subscribe({
      next: (result) => {
        this.rows.set(result.data);
        this.totalRecords.set(result.pagination.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
