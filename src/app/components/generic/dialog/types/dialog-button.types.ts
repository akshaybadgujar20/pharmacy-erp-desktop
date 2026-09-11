export type DialogButtonSeverity =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'info'
  | 'warn'
  | 'help'
  | 'danger'
  | 'contrast';

export type DialogButtonVariant = 'text' | 'outlined' | 'link';

export interface DialogButtonConfig {
  id: string;
  label: string;
  icon?: string;
  severity?: DialogButtonSeverity;
  variant?: DialogButtonVariant;
  size?: 'small' | 'large';
  disabled?: boolean;
}
