import { ConfirmDialogConfig } from '../../dialog/types/confirm-dialog.types';

export type ToolbarConfirmConfig = ConfirmDialogConfig;

export interface ToolbarActionBase {
  id: string;
  label?: string;
  icon?: string;
  ariaLabel?: string;
  permission?: string;
  permissions?: string[];
  anyPermission?: string[];
  role?: string;
  roles?: string[];
  visible?: boolean;
  disabled?: boolean;
  confirmation?: boolean | ToolbarConfirmConfig;
  shortcutId?: string;
  externalUrl?: string;
}
