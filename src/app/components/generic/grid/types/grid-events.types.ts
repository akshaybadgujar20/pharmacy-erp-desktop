import { GridSort } from './grid-sort.types';

export interface GridSelectionChange<T> {
  selectedRows: T[];
  selectedIds: Array<string | number>;
}

export interface GridFilterChange {
  filters: Record<string, unknown>;
  globalSearch?: string;
}

export interface GridSortChange {
  sort: GridSort[];
}

export interface GridPageChange {
  page: number;
  pageSize: number;
}

export interface GridActionEvent<T> {
  action: string;
  row?: T;
  rows?: T[];
}

export interface GridRowClickEvent<T> {
  row: T;
  action?: string;
}
