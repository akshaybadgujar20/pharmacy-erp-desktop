import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal, viewChild } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import {
  bindListScreenShortcuts,
  KeyboardShortcutService,
  type ShortcutBinding,
} from '../../core/keyboard';
import { ActiveScreenSearchService } from '../../core/services/active-screen-search.service';

import { AppGridComponent } from '../../components/generic/grid';
import { AppToolbarComponent } from '../../components/generic/toolbar';
import {
  GridFilterChange,
  GridPageChange,
} from '../../components/generic/grid/types/grid-events.types';
import { ToolbarActionEvent } from '../../components/generic/toolbar/types/toolbar-events.types';
import { toListParams } from '../../shared/utils/list-query.util';
import { CHANGE_HISTORY_GRID_CONFIG } from './change-history-grid.config';
import { AUDIT_LOG_TOOLBAR_CONFIG } from './audit-log-toolbar.config';
import { ChangeHistoryRow, ChangeHistoryService } from './change-history.service';

@Component({
  selector: 'app-change-history-list',
  standalone: true,
  imports: [FormsModule, InputTextModule, AppToolbarComponent, AppGridComponent],
  templateUrl: './change-history-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeHistoryListComponent implements OnInit, OnDestroy {
  private readonly changeHistory = inject(ChangeHistoryService);
  private readonly shortcuts = inject(KeyboardShortcutService);
  private readonly activeSearch = inject(ActiveScreenSearchService);
  private readonly grid = viewChild(AppGridComponent);
  private listShortcutBinding?: ShortcutBinding;

  readonly toolbarConfig = AUDIT_LOG_TOOLBAR_CONFIG;
  readonly gridConfig = CHANGE_HISTORY_GRID_CONFIG;

  readonly rows = signal<ChangeHistoryRow[]>([]);
  readonly loading = signal(false);
  readonly totalRecords = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly search = signal('');
  readonly entityType = signal('');
  readonly entityId = signal('');

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

  onFilterApply(): void {
    this.page.set(1);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    const params = toListParams(this.page(), this.pageSize(), this.search());
    const entityType = this.entityType().trim();
    const entityId = this.entityId().trim();
    if (entityType) {
      params['entityType'] = entityType;
    }
    if (entityId) {
      params['entityId'] = entityId;
    }
    this.changeHistory.list(params).subscribe({
      next: (result) => {
        this.rows.set(result.data);
        this.totalRecords.set(result.pagination.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
