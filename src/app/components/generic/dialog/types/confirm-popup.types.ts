import { ConfirmDialogConfig } from './confirm-dialog.types';

export interface ConfirmPopupConfig extends ConfirmDialogConfig {
  target?: EventTarget;
}
