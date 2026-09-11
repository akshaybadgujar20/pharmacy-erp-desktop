export interface GridSelectionConfig<T = unknown> {
  enabled?: boolean;
  mode?: 'single' | 'multiple';
  checkbox?: boolean;
  selectAll?: boolean;
  preserveSelection?: boolean;
  selectable?: (row: T) => boolean;
}
