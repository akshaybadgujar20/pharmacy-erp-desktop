import { DialogButtonSeverity, DialogButtonVariant } from './dialog-button.types';

export type ConfirmPreset = 'info' | 'danger' | 'custom';

export interface ConfirmButtonProps {
  label?: string;
  icon?: string;
  severity?: DialogButtonSeverity;
  variant?: DialogButtonVariant;
  size?: 'small' | 'large';
  text?: boolean;
  outlined?: boolean;
}

export interface ConfirmDialogConfig {
  message?: string;
  header?: string;
  icon?: string;
  acceptLabel?: string;
  rejectLabel?: string;
  acceptButtonProps?: ConfirmButtonProps;
  rejectButtonProps?: ConfirmButtonProps;
  preset?: ConfirmPreset;
  closable?: boolean;
  closeOnEscape?: boolean;
  key?: string;
  position?: string;
}
