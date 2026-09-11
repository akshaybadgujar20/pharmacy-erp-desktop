import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { AppGridComponent } from '../../../components/generic/grid';
import { AppToolbarComponent } from '../../../components/generic/toolbar';
import { GridFilterChange, GridPageChange } from '../../../components/generic/grid/types/grid-events.types';
import { ToolbarActionEvent } from '../../../components/generic/toolbar/types/toolbar-events.types';
import { KeyboardShortcutService } from '../../../core/keyboard';
import { toListParams } from '../../../shared/utils/list-query.util';
import { STOCK_GRID_CONFIG } from './stock-grid.config';
import { Stock } from './stock.models';
import { STOCK_TOOLBAR_CONFIG } from './stock-toolbar.config';
import { StockService } from './stock.service';

@Component({
  selector: 'app-stock-list',
  standalone: true,
  imports: [AppToolbarComponent, AppGridComponent],
  templateUrl: './stock-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockListComponent implements OnInit, OnDestroy {
  private readonly stockService = inject(StockService);
  private readonly shortcuts = inject(KeyboardShortcutService);

  readonly toolbarConfig = STOCK_TOOLBAR_CONFIG;
  readonly gridConfig = STOCK_GRID_CONFIG;

  readonly rows = signal<Stock[]>([]);
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

  private load(): void {
    this.loading.set(true);
    this.stockService
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
