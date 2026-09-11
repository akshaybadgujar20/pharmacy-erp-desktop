import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  OnDestroy,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import {
  ColumnState,
  FilterChangedEvent,
  GridApi,
  GridOptions,
  GridReadyEvent,
  RowClickedEvent,
  RowDoubleClickedEvent,
  SortChangedEvent,
} from 'ag-grid-community';
import { take } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../../core/services/auth.service';
import { resolveConfirmConfig } from '../dialog/adapter/dialog-defaults';
import { AppDialogService } from '../dialog/services/app-dialog.service';
import {
  buildGridOptions,
  normalizeFilterModel,
  normalizeSortModel,
  resolveRowId,
  toColumnDefs,
} from './adapter/grid-adapter';
import { mergeGridConfig } from './adapter/grid-defaults';
import { loadGridState, saveGridState } from './adapter/grid-state.storage';
import {
  GridActionsRendererComponent,
  GridActionsRendererContext,
} from './grid-actions-renderer.component';
import { GridSelectionState } from './state/grid-selection.state';
import {
  GridActionEvent,
  GridFilterChange,
  GridPageChange,
  GridRowClickEvent,
  GridSelectionChange,
  GridSortChange,
} from './types/grid-events.types';
import { GridConfig } from './types/grid.types';
import { GridToolbarAction } from './types/grid-toolbar.types';

@Component({
  selector: 'app-grid',
  standalone: true,
  imports: [
    AgGridAngular,
    ButtonModule,
    InputTextModule,
    FormsModule,
  ],
  templateUrl: './app-grid.component.html',
  styleUrl: './app-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppGridComponent<T = unknown> implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly appDialogService = inject(AppDialogService);

  config = input.required<GridConfig<T>>();
  data = input<T[]>([]);
  loading = input(false);
  totalRecords = input<number | undefined>(undefined);

  selectionChange = output<GridSelectionChange<T>>();
  filterChange = output<GridFilterChange>();
  sortChange = output<GridSortChange>();
  pageChange = output<GridPageChange>();
  action = output<GridActionEvent<T>>();
  rowClick = output<GridRowClickEvent<T>>();
  rowDoubleClick = output<GridRowClickEvent<T>>();

  readonly mergedConfig = computed(() => mergeGridConfig(this.config()));
  readonly columnDefs = computed(() => {
    const cfg = this.mergedConfig();
    const defs = toColumnDefs(cfg.columns, cfg.actions);
    if (cfg.actions?.length) {
      const actionsDef = defs.find((d) => d.colId === '__actions');
      if (actionsDef) {
        actionsDef.cellRenderer = GridActionsRendererComponent;
      }
    }
    return defs;
  });

  readonly gridOptions = computed((): GridOptions<T> => {
    const cfg = this.mergedConfig();
    const base = buildGridOptions(cfg);
    const context: GridActionsRendererContext<T> = {
      actions: cfg.actions ?? [],
      hasPermission: (permission) => this.hasPermission(permission),
      onAction: (actionId, row) => this.handleRowAction(actionId, row),
    };
    return {
      ...base,
      context,
      components: {
        appGridActionsRenderer: GridActionsRendererComponent,
      },
    };
  });

  readonly isServerSidePagination = computed(() => {
    const cfg = this.mergedConfig();
    return Boolean(cfg.pagination?.serverSide || cfg.dataSource?.serverSide);
  });

  readonly pageSizeOptions = computed(
    () => this.mergedConfig().pagination?.pageSizeOptions ?? [10, 25, 50, 100],
  );

  readonly globalSearch = signal('');
  readonly currentPage = signal(1);
  readonly currentPageSize = signal(25);
  readonly gridHeight = signal(400);

  private gridApi: GridApi<T> | null = null;
  private selectionState: GridSelectionState<T> | null = null;
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  readonly totalPages = computed(() => {
    const total = this.totalRecords() ?? this.data().length;
    const pageSize = this.currentPageSize();
    return Math.max(1, Math.ceil(total / pageSize) || 1);
  });

  readonly serverPaginationInfo = computed(() => {
    const total = this.totalRecords() ?? this.data().length;
    const page = this.currentPage();
    const pageSize = this.currentPageSize();
    const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);
    return `Showing ${start}-${end} of ${total}`;
  });

  visibleToolbarActions(): GridToolbarAction[] {
    const actions = this.mergedConfig().toolbar?.actions ?? [];
    return actions.filter(
      (a) => !a.permission || this.authService.hasPermission(a.permission),
    );
  }

  constructor() {
    effect(() => {
      const cfg = this.mergedConfig();
      this.currentPageSize.set(cfg.pagination?.pageSize ?? 25);
      this.initSelectionState(cfg);
    });

    effect(() => {
      const rows = this.data();
      this.selectionState?.reconcileData(rows);
      if (this.gridApi) {
        this.syncGridSelection(rows);
      }
    });

    effect(() => {
      const isLoading = this.loading();
      if (this.gridApi) {
        if (isLoading) {
          this.gridApi.showLoadingOverlay();
        } else if (this.data().length === 0) {
          this.gridApi.showNoRowsOverlay();
        } else {
          this.gridApi.hideOverlay();
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
  }

  onGridReady(event: GridReadyEvent<T>): void {
    this.gridApi = event.api;
    const cfg = this.mergedConfig();
    this.initSelectionState(cfg);
    this.restoreColumnState(cfg);
    if (this.loading()) {
      this.gridApi.showLoadingOverlay();
    }
  }

  onSelectionChanged(): void {
    if (!this.gridApi || !this.selectionState) {
      return;
    }
    const cfg = this.mergedConfig();
    if (!cfg.selection?.enabled) {
      return;
    }
    const selectedRows = this.gridApi.getSelectedRows();
    const getId = cfg.row?.getId ?? ((row: T) => resolveRowId(row));
    for (const row of this.data()) {
      const id = getId(row);
      const isSelected = selectedRows.some((r) => getId(r) === id);
      this.selectionState.toggle(row, isSelected);
    }
    this.emitSelectionChange();
  }

  onFilterChanged(event: FilterChangedEvent): void {
    const cfg = this.mergedConfig();
    if (cfg.filtering?.serverSide) {
      return;
    }
    this.filterChange.emit(normalizeFilterModel(event));
  }

  onSortChanged(event: SortChangedEvent): void {
    const cfg = this.mergedConfig();
    const sortChange = normalizeSortModel(event);
    if (cfg.sorting?.serverSide) {
      this.sortChange.emit(sortChange);
      return;
    }
    this.sortChange.emit(sortChange);
  }

  onPaginationChanged(): void {
    const cfg = this.mergedConfig();
    if (cfg.pagination?.serverSide || !this.gridApi) {
      return;
    }
    const page = (this.gridApi.paginationGetCurrentPage() ?? 0) + 1;
    const pageSize = this.gridApi.paginationGetPageSize();
    this.pageChange.emit({ page, pageSize });
  }

  onRowClicked(event: RowClickedEvent<T>): void {
    if (!event.data) {
      return;
    }
    this.rowClick.emit({ row: event.data });
  }

  onRowDoubleClicked(event: RowDoubleClickedEvent<T>): void {
    if (!event.data) {
      return;
    }
    const doubleClickAction = this.mergedConfig().row?.doubleClickAction;
    if (doubleClickAction) {
      this.action.emit({ action: doubleClickAction, row: event.data });
    }
    this.rowDoubleClick.emit({ row: event.data, action: doubleClickAction });
  }

  onGlobalSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.globalSearch.set(value);
    const cfg = this.mergedConfig();
    const debounce = cfg.filtering?.debounce ?? 300;
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    this.searchDebounceTimer = setTimeout(() => {
      this.filterChange.emit({ filters: {}, globalSearch: value });
      if (!cfg.filtering?.serverSide && this.gridApi) {
        this.gridApi.setGridOption('quickFilterText', value);
      }
    }, debounce);
  }

  emitToolbarAction(actionId: string): void {
    if (actionId === 'refresh') {
      this.action.emit({ action: 'refresh' });
      return;
    }
    this.action.emit({ action: actionId });
  }

  exportCsv(): void {
    if (!this.gridApi) {
      return;
    }
    const cfg = this.mergedConfig();
    const fileName = cfg.export?.fileName ?? 'export';
    this.gridApi.exportDataAsCsv({
      fileName: `${fileName}.csv`,
      onlySelected: cfg.export?.selectedRowsOnly ?? false,
    });
    this.action.emit({ action: 'export' });
  }

  goToPage(page: number): void {
    const totalPages = this.totalPages();
    const nextPage = Math.min(Math.max(1, page), totalPages);
    this.currentPage.set(nextPage);
    this.pageChange.emit({ page: nextPage, pageSize: this.currentPageSize() });
  }

  onPageSizeChange(event: Event): void {
    const pageSize = Number((event.target as HTMLSelectElement).value);
    this.currentPageSize.set(pageSize);
    this.currentPage.set(1);
    this.pageChange.emit({ page: 1, pageSize });
  }

  onColumnStateChanged(): void {
    this.persistColumnState();
  }

  private initSelectionState(cfg: GridConfig<T>): void {
    const getId = cfg.row?.getId ?? ((row: T) => resolveRowId(row));
    const preserve = cfg.selection?.preserveSelection ?? true;
    this.selectionState = new GridSelectionState<T>(getId, preserve);
  }

  private syncGridSelection(rows: T[]): void {
    if (!this.gridApi || !this.selectionState) {
      return;
    }
    const cfg = this.mergedConfig();
    if (!cfg.selection?.enabled) {
      return;
    }
    const getId = cfg.row?.getId ?? ((row: T) => resolveRowId(row));
    for (const row of rows) {
      const id = getId(row);
      const node = this.gridApi.getRowNode(String(id));
      if (node) {
        node.setSelected(this.selectionState.hasId(id));
      }
    }
  }

  private emitSelectionChange(): void {
    if (!this.selectionState) {
      return;
    }
    this.selectionChange.emit({
      selectedRows: this.selectionState.getSelectedRows(),
      selectedIds: this.selectionState.getSelectedIds(),
    });
  }

  private handleRowAction(actionId: string, row: T): void {
    const cfg = this.mergedConfig();
    const actionConfig = cfg.actions?.find((a) => a.id === actionId);
    if (!actionConfig) {
      this.action.emit({ action: actionId, row });
      return;
    }
    if (actionConfig.confirmation) {
      const config = resolveConfirmConfig(true, actionConfig.label);
      this.appDialogService
        .confirm(config)
        .pipe(take(1))
        .subscribe((accepted) => {
          if (accepted) {
            this.action.emit({ action: actionId, row });
          }
        });
      return;
    }
    this.action.emit({ action: actionId, row });
  }

  private hasPermission(permission?: string): boolean {
    if (!permission) {
      return true;
    }
    return this.authService.hasPermission(permission);
  }

  private restoreColumnState(cfg: GridConfig<T>): void {
    if (!this.gridApi || !cfg.state?.persist || !cfg.state.storageKey) {
      return;
    }
    const saved = loadGridState<ColumnState[]>(`${cfg.state.storageKey}:columns`);
    if (saved) {
      this.gridApi.applyColumnState({ state: saved, applyOrder: true });
    }
  }

  private persistColumnState(): void {
    const cfg = this.mergedConfig();
    if (!this.gridApi || !cfg.state?.persist || !cfg.state.storageKey) {
      return;
    }
    const columnState = this.gridApi.getColumnState();
    saveGridState(`${cfg.state.storageKey}:columns`, columnState);
    if (cfg.state.pageSize) {
      saveGridState(`${cfg.state.storageKey}:pageSize`, this.currentPageSize());
    }
  }
}
