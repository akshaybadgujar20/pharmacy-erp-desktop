export interface GridRowConfig<T = unknown> {
  getId?: (row: T) => string | number;
  height?: number;
  clickable?: boolean;
  hoverable?: boolean;
  doubleClickAction?: string;
  expandable?: boolean;
}
