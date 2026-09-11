import { GridConfig } from '../types/grid.types';

export const DEFAULT_GRID_CONFIG: Omit<GridConfig, 'columns'> = {
  selection: {
    enabled: false,
    mode: 'single',
    checkbox: false,
    selectAll: false,
    preserveSelection: true,
  },
  sorting: {
    enabled: true,
    multiple: true,
    serverSide: false,
  },
  filtering: {
    enabled: true,
    globalSearch: true,
    serverSide: false,
    debounce: 300,
    floatingFilter: false,
  },
  pagination: {
    enabled: true,
    pageSize: 25,
    pageSizeOptions: [10, 25, 50, 100],
    serverSide: false,
  },
  appearance: {
    compact: false,
    striped: true,
    borders: true,
    showGridLines: true,
    emptyMessage: 'No records found',
    loadingMessage: 'Loading...',
  },
  export: {
    enabled: false,
    formats: ['csv'],
    fileName: 'export',
    selectedRowsOnly: false,
  },
  state: {
    persist: false,
    columns: true,
    sorting: false,
    filtering: false,
    pageSize: true,
    columnWidths: true,
    columnOrder: true,
  },
};

export function mergeGridConfig<T>(config: GridConfig<T>): GridConfig<T> {
  const defaults = DEFAULT_GRID_CONFIG;
  return {
    ...defaults,
    ...config,
    selection: { ...defaults.selection, ...config.selection },
    sorting: { ...defaults.sorting, ...config.sorting },
    filtering: { ...defaults.filtering, ...config.filtering },
    pagination: { ...defaults.pagination, ...config.pagination },
    appearance: { ...defaults.appearance, ...config.appearance },
    export: { ...defaults.export, ...config.export },
    state: { ...defaults.state, ...config.state },
    row: config.row ? { ...config.row } : undefined,
    toolbar: config.toolbar ? { ...config.toolbar } : undefined,
    dataSource: config.dataSource ? { ...config.dataSource } : undefined,
    columns: config.columns.map((col) => ({ ...col })),
    actions: config.actions?.map((action) => ({ ...action })),
  };
}
