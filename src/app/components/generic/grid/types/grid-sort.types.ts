export interface GridSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface GridSortingConfig {
  enabled?: boolean;
  multiple?: boolean;
  serverSide?: boolean;
  default?: GridSort[];
}
