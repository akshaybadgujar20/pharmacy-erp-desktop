export type ToastSeverity =
  | 'success'
  | 'info'
  | 'warn'
  | 'error'
  | 'secondary'
  | 'contrast';

export interface ToastMessageConfig {
  severity?: ToastSeverity;
  summary: string;
  detail?: string;
  life?: number;
  sticky?: boolean;
  closable?: boolean;
  key?: string;
  icon?: string;
  styleClass?: string;
}

export type ToastMessageOverrides = Partial<
  Omit<ToastMessageConfig, 'summary' | 'detail'>
>;
