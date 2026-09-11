export interface GridActionConfig<T = unknown> {
  id: string;
  label: string;
  icon?: string;
  permission?: string;
  visible?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
  confirmation?: boolean;
}
