import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal, viewChild } from '@angular/core';

import { Router } from '@angular/router';
import {
  bindListScreenShortcuts,
  KeyboardShortcutService,
  type ShortcutBinding,
} from '../../../core/keyboard';
import { ActiveScreenSearchService } from '../../../core/services/active-screen-search.service';

import { AppGridComponent } from '../../../components/generic/grid';
import { AppToolbarComponent } from '../../../components/generic/toolbar';
import {
  GridActionEvent,
  GridFilterChange,
  GridPageChange,
  GridRowClickEvent,
} from '../../../components/generic/grid/types/grid-events.types';
import { ToolbarActionEvent } from '../../../components/generic/toolbar/types/toolbar-events.types';
import { toListParams } from '../../../shared/utils/list-query.util';
import { SALES_RETURN_GRID_CONFIG } from './sales-return-grid.config';
import { SALES_RETURN_TOOLBAR_CONFIG } from './sales-return-toolbar.config';
import { SalesReturn } from './sales-return.models';
import { SalesReturnService } from './sales-return.service';

@Component({
  selector: 'app-sales-return-list',
  standalone: true,
  imports: [AppToolbarComponent, AppGridComponent],
  templateUrl: './sales-return-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesReturnListComponent implements OnInit, OnDestroy {
  private readonly salesReturnService = inject(SalesReturnService);
  private readonly router = inject(Router);
  private readonly shortcuts = inject(KeyboardShortcutService);
  private readonly activeSearch = inject(ActiveScreenSearchService);
  private readonly grid = viewChild(AppGridComponent);
  private listShortcutBinding?: ShortcutBinding;

  readonly toolbarConfig = SALES_RETURN_TOOLBAR_CONFIG;
  readonly gridConfig = SALES_RETURN_GRID_CONFIG;

  readonly rows = signal<SalesReturn[]>([]);
  readonly loading = signal(false);
  readonly totalRecords = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly search = signal('');

  ngOnInit(): void {
    this.listShortcutBinding = bindListScreenShortcuts(this.shortcuts, this.activeSearch, {
      refresh: () => this.load(),
      create: () => this.onNew(),
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
    if (event.action === 'create') {
      this.onNew();
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

  onGridAction(event: GridActionEvent<SalesReturn>): void {
    if (!event.row) {
      return;
    }
    if (event.action === 'edit') {
      this.router.navigate(['/sales/returns', event.row.id]);
    }
    if (event.action === 'delete') {
      this.salesReturnService.delete(event.row.id, event.row.version).subscribe({
        next: () => this.load(),
      });
    }
  }

  onRowDoubleClick(event: GridRowClickEvent<SalesReturn>): void {
    this.router.navigate(['/sales/returns', event.row.id]);
  }

  private onNew(): void {
    this.router.navigate(['/sales/returns/new']);
  }

  private load(): void {
    this.loading.set(true);
    this.salesReturnService
      .list(toListParams(this.page(), this.pageSize(), this.search()))
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
