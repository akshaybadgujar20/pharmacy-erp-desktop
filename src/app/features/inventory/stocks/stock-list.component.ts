import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { GridActionEvent } from '../../../components/generic/grid/types/grid-events.types';
import { AppGridComponent } from '../../../components/generic/grid';
import { AppToolbarComponent } from '../../../components/generic/toolbar';
import { GridFilterChange, GridPageChange } from '../../../components/generic/grid/types/grid-events.types';
import { ToolbarActionEvent } from '../../../components/generic/toolbar/types/toolbar-events.types';
import { KeyboardShortcutService } from '../../../core/keyboard';
import { toListParams } from '../../../shared/utils/list-query.util';
import { STOCK_GRID_CONFIG } from './stock-grid.config';
import { Stock } from './stock.models';
import { STOCK_TOOLBAR_CONFIG } from './stock-toolbar.config';
import { ElectronService } from '../../../core/services/electron.service';
import { StockService } from './stock.service';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-stock-list',
  standalone: true,
  imports: [RouterLink, AppToolbarComponent, AppGridComponent, DialogModule],
  templateUrl: './stock-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockListComponent implements OnInit, OnDestroy {
  private readonly stockService = inject(StockService);
  private readonly router = inject(Router);
  private readonly electron = inject(ElectronService);
  private readonly shortcuts = inject(KeyboardShortcutService);
  private unsubscribeBarcode?: () => void;

  readonly fefoPreview = signal<string[]>([]);
  readonly fefoDialogVisible = signal(false);

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
    this.unsubscribeBarcode = this.electron.onBarcodeScan((code) => {
      this.search.set(code);
      this.page.set(1);
      this.load();
    });
    this.load();
  }

  ngOnDestroy(): void {
    this.shortcuts.unregisterHandler('global.refresh');
    this.unsubscribeBarcode?.();
  }

  openFefoDialog(medicineId: string): void {
    const id = medicineId.trim();
    if (!id) {
      return;
    }
    this.stockService.fefoPreview(id).subscribe({
      next: (rows) => {
        this.fefoPreview.set(
          rows.map(
            (row) =>
              `${row.batchNumber} exp ${row.expiryDate} avail ${row.availableQuantity} (batch ${row.batchId})`,
          ),
        );
        this.fefoDialogVisible.set(true);
      },
    });
  }

  onGridAction(event: GridActionEvent<Stock>): void {
    if (!event.row || event.action !== 'adjust') {
      return;
    }
    this.router.navigate(['/inventory/stock-adjustments/new'], {
      queryParams: { batchId: event.row.batchId, branchId: event.row.branchId },
    });
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
