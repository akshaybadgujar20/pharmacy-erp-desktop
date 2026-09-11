export interface DynamicDialogConfig {
  header?: string;
  width?: string;
  height?: string;
  modal?: boolean;
  closable?: boolean;
  maximizable?: boolean;
  dismissableMask?: boolean;
  closeOnEscape?: boolean;
  contentStyle?: Record<string, string>;
  baseZIndex?: number;
  breakpoints?: Record<string, string>;
  data?: Record<string, unknown>;
  inputValues?: Record<string, unknown>;
}
