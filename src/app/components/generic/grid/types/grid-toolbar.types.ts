export interface GridToolbarAction {
  id: string;
  label: string;
  icon?: string;
  permission?: string;
}

export interface GridToolbarConfig {
  enabled?: boolean;
  search?: boolean;
  refresh?: boolean;
  export?: boolean;
  actions?: GridToolbarAction[];
}
