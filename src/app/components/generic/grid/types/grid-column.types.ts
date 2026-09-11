import { Type } from '@angular/core';

export type GridColumnType =
  | 'text'
  | 'number'
  | 'currency'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'status'
  | 'select';

export type GridFilterType =
  | 'text'
  | 'number'
  | 'numberRange'
  | 'date'
  | 'dateRange'
  | 'select'
  | 'multiSelect'
  | 'boolean';

export interface GridOption {
  label: string;
  value: string | number | boolean;
}

export interface GridFilterConfig {
  type?: GridFilterType;
}

export interface GridColumn<T = unknown> {
  field: keyof T | string;
  headerName: string;
  type?: GridColumnType;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  flex?: number;
  visible?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  resizable?: boolean;
  reorderable?: boolean;
  pinned?: 'left' | 'right';
  align?: 'left' | 'center' | 'right';
  format?: string;
  tooltip?: string | ((value: unknown, row: T) => string);
  cellClass?: string | ((value: unknown, row: T) => string);
  headerClass?: string;
  formatter?: (value: unknown, row: T) => unknown;
  filter?: GridFilterConfig;
  options?: GridOption[];
  cellRenderer?: Type<unknown>;
}
