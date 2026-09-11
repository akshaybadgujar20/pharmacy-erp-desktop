import { format } from 'date-fns';
import {
  ColDef,
  FilterChangedEvent,
  GridOptions,
  SortChangedEvent,
  ValueFormatterParams,
} from 'ag-grid-community';
import { GridActionConfig } from '../types/grid-action.types';
import { GridColumn } from '../types/grid-column.types';
import { GridFilterChange, GridSortChange } from '../types/grid-events.types';
import { GridConfig } from '../types/grid.types';
import { GridSort } from '../types/grid-sort.types';

const ACTIONS_COLUMN_ID = '__actions';

export function resolveRowId<T>(row: T, getId?: (row: T) => string | number): string {
  if (getId) {
    return String(getId(row));
  }
  const record = row as Record<string, unknown>;
  if (record['id'] !== undefined && record['id'] !== null) {
    return String(record['id']);
  }
  return JSON.stringify(row);
}

export function buildValueFormatter<T>(column: GridColumn<T>): ((params: ValueFormatterParams) => string) | undefined {
  if (column.formatter) {
    return (params: ValueFormatterParams) => String(column.formatter!(params.value, params.data as T));
  }
  switch (column.type) {
    case 'currency':
      return (params: ValueFormatterParams) => {
        const value = params.value;
        if (value === null || value === undefined || value === '') {
          return '';
        }
        const num = typeof value === 'number' ? value : Number(value);
        if (Number.isNaN(num)) {
          return String(value);
        }
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: 2,
        }).format(num);
      };
    case 'date':
      return (params: ValueFormatterParams) => {
        if (!params.value) {
          return '';
        }
        const date = new Date(params.value as string | number | Date);
        return Number.isNaN(date.getTime()) ? String(params.value) : format(date, column.format ?? 'dd/MM/yyyy');
      };
    case 'datetime':
      return (params: ValueFormatterParams) => {
        if (!params.value) {
          return '';
        }
        const date = new Date(params.value as string | number | Date);
        return Number.isNaN(date.getTime()) ? String(params.value) : format(date, column.format ?? 'dd/MM/yyyy HH:mm');
      };
    case 'boolean':
      return (params: ValueFormatterParams) => (params.value ? 'Yes' : 'No');
    case 'status':
      return (params: ValueFormatterParams) => String(params.value ?? '');
    default:
      return undefined;
  }
}

function toAgFilterType(filterType?: string): string | boolean {
  switch (filterType) {
    case 'number':
    case 'numberRange':
      return 'agNumberColumnFilter';
    case 'date':
    case 'dateRange':
      return 'agDateColumnFilter';
    case 'select':
    case 'multiSelect':
      return 'agSetColumnFilter';
    case 'boolean':
      return 'agSetColumnFilter';
    default:
      return 'agTextColumnFilter';
  }
}

export function toColumnDefs<T>(
  columns: GridColumn<T>[],
  actions?: GridActionConfig<T>[],
): ColDef[] {
  const defs: ColDef[] = columns
    .filter((col) => col.visible !== false)
    .map((col) => {
      const field = String(col.field);
      const def: ColDef = {
        field,
        headerName: col.headerName,
        sortable: col.sortable ?? true,
        filter: col.filterable !== false,
        resizable: col.resizable ?? true,
        hide: col.visible === false,
        pinned: col.pinned ?? undefined,
        width: col.width,
        minWidth: col.minWidth,
        maxWidth: col.maxWidth,
        flex: col.flex,
        headerClass: col.headerClass,
        cellClass: typeof col.cellClass === 'string' ? col.cellClass : undefined,
        valueFormatter: buildValueFormatter(col),
        cellRenderer: col.cellRenderer ?? undefined,
      };
      if (col.align) {
        def.cellStyle = { textAlign: col.align };
      }
      if (col.type === 'status') {
        def.cellClass = 'app-grid-status-cell';
      }
      if (col.filter) {
        def.filter = toAgFilterType(col.filter.type);
      }
      if (col.filterable === false) {
        def.filter = false;
      }
      if (col.sortable === false) {
        def.sortable = false;
      }
      return def;
    });
  if (actions && actions.length > 0) {
    defs.push({
      colId: ACTIONS_COLUMN_ID,
      headerName: '',
      field: ACTIONS_COLUMN_ID,
      sortable: false,
      filter: false,
      resizable: false,
      pinned: 'right',
      width: Math.min(48 * actions.length, 200),
      cellRenderer: 'appGridActionsRenderer',
      suppressHeaderMenuButton: true,
    });
  }
  return defs;
}

export function normalizeFilterModel(event: FilterChangedEvent): GridFilterChange {
  const filters: Record<string, unknown> = {};
  const model = event.api.getFilterModel() as Record<string, unknown>;
  for (const [field, value] of Object.entries(model)) {
    filters[field] = value;
  }
  return { filters };
}

export function normalizeSortModel(event: SortChangedEvent): GridSortChange {
  const sort: GridSort[] = [];
  const columnState = event.api.getColumnState();
  for (const col of columnState) {
    if (col.sort) {
      sort.push({
        field: col.colId,
        direction: col.sort as 'asc' | 'desc',
      });
    }
  }
  return { sort };
}

export function buildGridOptions<T>(config: GridConfig<T>): Partial<GridOptions<T>> {
  const pagination = config.pagination ?? {};
  const sorting = config.sorting ?? {};
  const filtering = config.filtering ?? {};
  const selection = config.selection ?? {};
  const appearance = config.appearance ?? {};
  const row = config.row ?? {};
  const serverSide = Boolean(
    pagination.serverSide || sorting.serverSide || filtering.serverSide || config.dataSource?.serverSide,
  );
  return {
    rowSelection: selection.enabled
      ? {
          mode: selection.mode === 'multiple' ? 'multiRow' : 'singleRow',
          checkboxes: selection.checkbox ?? false,
          headerCheckbox: selection.selectAll ?? false,
          enableClickSelection: selection.checkbox ? false : true,
        }
      : undefined,
    pagination: pagination.enabled && !serverSide,
    paginationPageSize: pagination.pageSize ?? 25,
    paginationPageSizeSelector: pagination.pageSizeOptions ?? [10, 25, 50, 100],
    suppressPaginationPanel: serverSide,
    animateRows: true,
    rowHeight: row.height,
    overlayLoadingTemplate: `<span class="app-grid-overlay">${appearance.loadingMessage ?? 'Loading...'}</span>`,
    overlayNoRowsTemplate: `<span class="app-grid-overlay">${appearance.emptyMessage ?? 'No records found'}</span>`,
    suppressCellFocus: false,
    enableCellTextSelection: true,
    defaultColDef: {
      sortable: sorting.enabled !== false,
      filter: filtering.enabled !== false && !filtering.serverSide,
      resizable: true,
      floatingFilter: filtering.floatingFilter ?? false,
    },
    getRowId: row.getId
      ? (params) => resolveRowId(params.data, row.getId)
      : (params) => resolveRowId(params.data),
    suppressMultiSort: sorting.multiple === false,
    accentedSort: true,
    rowClass: appearance.striped ? 'app-grid-row-striped' : undefined,
  };
}

export const GRID_ACTIONS_COLUMN_ID = ACTIONS_COLUMN_ID;
